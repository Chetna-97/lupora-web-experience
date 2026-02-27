require('dotenv').config(); // MUST be the first line
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const multer = require('multer');

const app = express();

// ── Security Middleware ──────────────────────────────────

// Helmet: sets secure HTTP headers (XSS, clickjack, MIME sniffing protection)
app.use(helmet());

// CORS: restrict to known origins only
app.use(cors({
    origin: ['http://localhost:5173', 'https://chetna-97.github.io'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parser with size limit (prevents large payload DoS)
app.use(express.json({ limit: '1mb' }));

// NoSQL injection protection (Express 5 makes req.query read-only, so sanitize body/params manually)
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key of Object.keys(obj)) {
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                sanitize(obj[key]);
            }
        }
    };
    sanitize(req.body);
    sanitize(req.params);
    next();
});

// Gzip compression
app.use(compression());

// Rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // 15 attempts per window
    message: { message: 'Too many attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { message: 'Too many requests, please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
});

const orderLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 orders per 5 minutes per IP
    message: { message: 'Too many orders, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limits
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/payment', authLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api', apiLimiter);

// ── Environment Validation ──────────────────────────────────
function validateEnv() {
    const required = ['MONGO_URI', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`Missing required env vars: ${missing.join(', ')}`);
        process.exit(1);
    }
    // Warn about optional but recommended vars
    if (!process.env.RESEND_API_KEY) console.warn('RESEND_API_KEY not set — emails disabled');
    if (!process.env.OWNER_EMAIL) console.warn('OWNER_EMAIL not set — order notifications disabled');
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.warn('Razorpay keys not set — online payments disabled');
    }
}
validateEnv();

// 1. Connection String
const mongoURI = process.env.MONGO_URI;

// 2. Connect to MongoDB
let isConnected = false;

console.log("🔄 Attempting to connect to MongoDB...");

mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 10000, // 10 second timeout
})
    .then(() => {
        console.log("✅ MongoDB Connected Successfully");
        isConnected = true;
    })
    .catch(err => {
        console.error("MongoDB Connection Error:", err.message);
        process.exit(1);
    });

// 3. Define Schema & Model
const variantSchema = new mongoose.Schema({
    size: { type: String, enum: ['8ml', '50ml', '100ml'], required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0, default: null },
    image: String,
    stock: { type: Number, default: -1 }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    image: String,
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0, default: null },
    stock: { type: Number, default: -1 },
    description: String,
    variants: { type: [variantSchema], default: [] }
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

// Media Schema for videos
const mediaSchema = new mongoose.Schema({
    name: String,
    type: String,
    url: String
}, { collection: 'media' });

const Media = mongoose.model('Media', mediaSchema);

// Address sub-schema
const addressSchema = new mongoose.Schema({
    label: { type: String, default: 'Home' },
    fullName: { type: String, required: true, maxlength: 100 },
    address: { type: String, required: true, maxlength: 500 },
    city: { type: String, required: true, maxlength: 50 },
    state: { type: String, required: true, maxlength: 50 },
    pincode: { type: String, required: true, maxlength: 10 },
    isDefault: { type: Boolean, default: false }
}, { _id: true });

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    addresses: { type: [addressSchema], default: [] },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null }
}, { collection: 'users', timestamps: true });

const User = mongoose.model('User', userSchema);

// Cart Schema
const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String, enum: ['8ml', '50ml', '100ml'], default: null },
    quantity: { type: Number, required: true, min: 1, default: 1 }
});

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [cartItemSchema],
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'carts', timestamps: true });

// Auto-expire abandoned carts after 30 days
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Cart = mongoose.model('Cart', cartSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        size: { type: String, default: null },
        price: Number,
        quantity: Number,
        image: String
    }],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true }
    },
    customerEmail: { type: String },
    paymentMethod: { type: String, enum: ['cod', 'razorpay'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    orderStatus: { type: String, enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'placed' }
}, { collection: 'orders', timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 500 }
}, { collection: 'reviews', timestamps: true });

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

// Newsletter Schema
const newsletterSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }
}, { collection: 'newsletter', timestamps: true });

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

// Razorpay instance (only if keys are configured)
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

// Resend email client
let resendClient = null;

function getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.log('⚠️ RESEND_API_KEY is missing — emails disabled');
        return null;
    }
    if (!resendClient) {
        resendClient = new Resend(apiKey);
    }
    return resendClient;
}

// Verify email config on startup
async function verifyEmailConfig() {
    const resend = getResend();
    if (!resend) return;
    console.log('📧 Resend configured — emails enabled!');
    console.log(`   OWNER_EMAIL: ${process.env.OWNER_EMAIL || '❌ not set'}`);
}

// Email helper — sends order notification to shop owner + confirmation to customer
async function sendOrderEmails(order) {
    const ownerEmail = process.env.OWNER_EMAIL;
    const resend = getResend();

    if (!resend) return;

    const itemsList = order.items.map(item => {
        const sizeLabel = item.size ? ` (${item.size})` : '';
        return `  - ${item.name}${sizeLabel} x${item.quantity} — Rs.${(item.price * item.quantity).toLocaleString('en-IN')}`;
    }).join('\n');

    const addr = order.shippingAddress;
    const orderId = order._id.toString().slice(-8).toUpperCase();

    // 1. Email to shop owner
    if (ownerEmail) {
        try {
            await resend.emails.send({
                from: 'Lupora Orders <onboarding@resend.dev>',
                to: ownerEmail,
                subject: `New Order #${orderId} — Lupora Perfumes`,
                text: `NEW ORDER RECEIVED\n\n` +
                      `Order ID: #${orderId}\n` +
                      `Customer: ${addr.fullName}\n` +
                      `Customer Email: ${order.customerEmail || 'Not provided'}\n` +
                      `Customer Phone: ${addr.phone}\n` +
                      `Date: ${new Date(order.createdAt).toLocaleString('en-IN')}\n` +
                      `Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (Online)'}\n` +
                      `Payment Status: ${order.paymentStatus}\n\n` +
                      `ITEMS:\n${itemsList}\n\n` +
                      `Total: Rs.${order.totalAmount.toLocaleString('en-IN')}\n\n` +
                      `SHIP TO:\n` +
                      `  ${addr.fullName}\n` +
                      `  ${addr.phone}\n` +
                      `  ${addr.address}\n` +
                      `  ${addr.city}, ${addr.state} — ${addr.pincode}\n`
            });
            console.log('📧 Owner notification email sent');
        } catch (err) {
            console.error('📧 Owner email failed:', err.message);
        }
    }

    // 2. Confirmation email to customer (via owner email as BCC workaround for free plan)
    // Note: Resend free plan with onboarding@resend.dev can only send to the account owner's email.
    // To send directly to customers, verify a custom domain at https://resend.com/domains
    if (order.customerEmail && ownerEmail) {
        try {
            await resend.emails.send({
                from: 'Lupora Perfumes <onboarding@resend.dev>',
                to: ownerEmail,
                subject: `[Forward to Customer] Thank you for your order! #${orderId}`,
                text: `⚠️ FORWARD THIS EMAIL TO: ${order.customerEmail}\n` +
                      `(Resend free plan cannot send directly to customers)\n\n` +
                      `--- Customer Email Below ---\n\n` +
                      `Dear ${addr.fullName},\n\n` +
                      `Thank you for shopping with Lupora Perfumes!\n\n` +
                      `Your order has been placed successfully.\n\n` +
                      `ORDER DETAILS\n` +
                      `Order ID: #${orderId}\n` +
                      `Date: ${new Date(order.createdAt).toLocaleString('en-IN')}\n\n` +
                      `ITEMS:\n${itemsList}\n\n` +
                      `Total: Rs.${order.totalAmount.toLocaleString('en-IN')}\n` +
                      `Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}\n\n` +
                      `SHIPPING TO:\n` +
                      `  ${addr.address}\n` +
                      `  ${addr.city}, ${addr.state} — ${addr.pincode}\n\n` +
                      `We will notify you when your order is shipped.\n\n` +
                      `With love,\n` +
                      `Team Lupora\n` +
                      `www.instagram.com/lupora_perfumes\n`
            });
            console.log(`📧 Customer confirmation sent to owner for forwarding to ${order.customerEmail}`);
        } catch (err) {
            console.error('📧 Customer email failed:', err.message);
        }
    }
}

// In-memory cache to avoid hitting MongoDB on every request
let productsCache = null;
let mediaCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid() {
    return Date.now() - cacheTimestamp < CACHE_TTL;
}

// 4. API Routes
// Health check route
app.get('/', (req, res) => res.send("Lupora Server is Running..."));

// Test email route — protected, owner only
app.get('/api/test-email', authenticateToken, async (req, res) => {
    const resend = getResend();
    if (!resend) {
        return res.status(500).json({ message: 'Email not configured' });
    }
    try {
        await resend.emails.send({
            from: 'Lupora Perfumes <onboarding@resend.dev>',
            to: process.env.OWNER_EMAIL,
            subject: 'Lupora Email Test — Working!',
            text: 'This is a test email from your Lupora server.\n\nIf you received this, your email configuration is correct!\n\n— Lupora Server'
        });
        res.json({ message: 'Test email sent successfully' });
    } catch (err) {
        console.error('Test email failed:', err.message);
        res.status(500).json({ message: 'Email sending failed' });
    }
});

// Fetch products route — with in-memory cache
app.get('/api/products', async (req, res) => {
    try {
        // Check if MongoDB is connected
        if (!isConnected) {
            console.error("🔥 Database not connected yet");
            return res.status(503).json({ message: "Database not connected" });
        }

        // Return cached data if valid
        if (productsCache && isCacheValid()) {
            res.set('Cache-Control', 'public, max-age=300');
            return res.status(200).json(productsCache);
        }

        console.log("📦 Fetching products from database...");
        const products = await Product.find().lean();
        console.log(`✅ Found ${products.length} products`);

        // Update cache
        productsCache = products;
        cacheTimestamp = Date.now();

        res.set('Cache-Control', 'public, max-age=300');
        res.status(200).json(products);
    } catch (error) {
        console.error("Products fetch error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Fetch media/videos route — with in-memory cache
app.get('/api/media', async (req, res) => {
    try {
        if (!isConnected) {
            console.error("🔥 Database not connected yet");
            return res.status(503).json({ message: "Database not connected" });
        }

        // Return cached data if valid
        if (mediaCache && isCacheValid()) {
            res.set('Cache-Control', 'public, max-age=300');
            return res.status(200).json(mediaCache);
        }

        console.log("🎬 Fetching media from database...");
        const media = await Media.find().lean();
        console.log(`✅ Found ${media.length} media items`);

        // Update cache
        mediaCache = media;
        cacheTimestamp = Date.now();

        res.set('Cache-Control', 'public, max-age=300');
        res.status(200).json(media);
    } catch (error) {
        console.error("🔥 API Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Search products
app.get('/api/products/search', async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }
        const q = String(req.query.q || '').trim();
        if (!q || q.length < 1) return res.status(200).json([]);
        if (q.length > 100) return res.status(400).json({ message: 'Query too long' });

        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        const results = await Product.find({
            $or: [{ name: regex }, { category: regex }]
        }).limit(8).lean();
        res.status(200).json(results);
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Fetch single product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const product = await Product.findById(id).lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error("Product fetch error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Validate token payload has required fields
        if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
            return res.status(403).json({ message: 'Invalid token payload' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Input length & format validation
        if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
            return res.status(400).json({ message: 'Name must be 2-50 characters' });
        }
        if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
            return res.status(400).json({ message: 'Password must be 6-128 characters' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ name: name.trim(), email: email.toLowerCase(), password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, phone: '', profilePicture: '', addresses: [] }
        });
    } catch (error) {
        console.error("Register error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            token,
            user: {
                id: user._id, name: user.name, email: user.email,
                phone: user.phone || '', profilePicture: user.profilePicture || '',
                addresses: user.addresses || []
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            id: user._id, name: user.name, email: user.email,
            phone: user.phone || '', profilePicture: user.profilePicture || '',
            addresses: user.addresses || []
        });
    } catch (error) {
        console.error("Auth me error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { name, phone, profilePicture } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const updates = { name: name.trim() };
        if (phone !== undefined) {
            if (phone && (typeof phone !== 'string' || phone.length > 15)) {
                return res.status(400).json({ message: 'Invalid phone number' });
            }
            updates.phone = phone || '';
        }
        if (profilePicture !== undefined) {
            if (profilePicture && typeof profilePicture !== 'string') {
                return res.status(400).json({ message: 'Invalid profile picture' });
            }
            updates.profilePicture = profilePicture || '';
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true }
        ).select('-password -resetToken -resetTokenExpiry');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token,
            user: {
                id: user._id, name: user.name, email: user.email,
                phone: user.phone || '', profilePicture: user.profilePicture || '',
                addresses: user.addresses || []
            }
        });
    } catch (error) {
        console.error("Profile update error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Upload profile picture
const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
        }
    }
});

app.post('/api/auth/upload-avatar', authenticateToken, (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Image must be under 2MB' });
            }
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!isConnected) return res.status(503).json({ message: 'Database not connected' });
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

        const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: base64 },
            { new: true }
        ).select('-password -resetToken -resetTokenExpiry');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ profilePicture: user.profilePicture });
    } catch (error) {
        console.error('Avatar upload error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Change password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both current and new password are required' });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 128) {
            return res.status(400).json({ message: 'New password must be 6-128 characters' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error("Password change error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Add address
app.post('/api/auth/addresses', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) return res.status(503).json({ message: 'Database not connected' });
        const { label, fullName, address, city, state, pincode, isDefault } = req.body;
        if (!fullName || !address || !city || !state || !pincode) {
            return res.status(400).json({ message: 'All address fields are required' });
        }
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (isDefault) {
            user.addresses.forEach(a => { a.isDefault = false; });
        }
        user.addresses.push({
            label: label || 'Home', fullName: fullName.trim(),
            address: address.trim(), city: city.trim(), state: state.trim(),
            pincode: pincode.trim(), isDefault: isDefault || user.addresses.length === 0
        });
        await user.save();
        res.status(201).json({ addresses: user.addresses });
    } catch (error) {
        console.error('Add address error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update address
app.put('/api/auth/addresses/:addressId', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) return res.status(503).json({ message: 'Database not connected' });
        const { label, fullName, address, city, state, pincode, isDefault } = req.body;
        if (!fullName || !address || !city || !state || !pincode) {
            return res.status(400).json({ message: 'All address fields are required' });
        }
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const addr = user.addresses.id(req.params.addressId);
        if (!addr) return res.status(404).json({ message: 'Address not found' });

        if (isDefault) {
            user.addresses.forEach(a => { a.isDefault = false; });
        }
        Object.assign(addr, {
            label: label || addr.label, fullName: fullName.trim(),
            address: address.trim(), city: city.trim(), state: state.trim(),
            pincode: pincode.trim(), isDefault: isDefault !== undefined ? isDefault : addr.isDefault
        });
        await user.save();
        res.status(200).json({ addresses: user.addresses });
    } catch (error) {
        console.error('Update address error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Delete address
app.delete('/api/auth/addresses/:addressId', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) return res.status(503).json({ message: 'Database not connected' });
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const addr = user.addresses.id(req.params.addressId);
        if (!addr) return res.status(404).json({ message: 'Address not found' });

        const wasDefault = addr.isDefault;
        addr.deleteOne();
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }
        await user.save();
        res.status(200).json({ addresses: user.addresses });
    } catch (error) {
        console.error('Delete address error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Delete account
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) return res.status(503).json({ message: 'Database not connected' });
        const { password } = req.body;
        if (!password) return res.status(400).json({ message: 'Password is required to delete account' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

        // Clean up user data
        await Cart.deleteMany({ userId: req.user.id });
        await Review.deleteMany({ userId: req.user.id });
        await User.findByIdAndDelete(req.user.id);

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Forgot password — send reset link
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Always return success to prevent email enumeration
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
        }

        // Generate token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetToken = hashedToken;
        user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        // Build reset URL
        const frontendUrl = process.env.FRONTEND_URL || 'https://chetna-97.github.io/lupora-web-experience';
        const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

        // Send email
        const resend = getResend();
        if (resend) {
            const ownerEmail = process.env.OWNER_EMAIL;
            await resend.emails.send({
                from: 'Lupora <onboarding@resend.dev>',
                to: ownerEmail || user.email,
                subject: 'Password Reset — Lupora Perfumes',
                text: ownerEmail
                    ? `FORWARD THIS TO: ${user.email}\n\nHi ${user.name},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.\n\n— Lupora Perfumes`
                    : `Hi ${user.name},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.\n\n— Lupora Perfumes`
            });
        }

        res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
    } catch (error) {
        console.error('Forgot password error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Reset password — verify token and set new password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }
        const { token, email, newPassword } = req.body;
        if (!token || !email || !newPassword) {
            return res.status(400).json({ message: 'Token, email, and new password are required' });
        }
        if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 128) {
            return res.status(400).json({ message: 'Password must be 6-128 characters' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            email: email.toLowerCase(),
            resetToken: hashedToken,
            resetTokenExpiry: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Fetch cart (authenticated)
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId').lean();

        if (!cart) {
            return res.status(200).json({ items: [], totalItems: 0, totalPrice: 0 });
        }

        const validItems = cart.items.filter(item => item.productId != null);

        const enrichedItems = validItems.map(item => {
            const product = item.productId;
            let price = product.price;
            let originalPrice = product.originalPrice || null;
            let image = product.image;

            if (item.size && product.variants && product.variants.length > 0) {
                const variant = product.variants.find(v => v.size === item.size);
                if (variant) {
                    price = variant.price;
                    originalPrice = variant.originalPrice || null;
                    image = variant.image || product.image;
                }
            }

            return {
                productId: product._id,
                name: product.name,
                category: product.category,
                image,
                price,
                originalPrice,
                quantity: item.quantity,
                size: item.size || null
            };
        });

        const totalItems = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = enrichedItems.reduce(
            (sum, item) => sum + (item.price || 0) * item.quantity, 0
        );

        res.status(200).json({
            items: enrichedItems,
            totalItems,
            totalPrice
        });
    } catch (error) {
        console.error("Cart fetch error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Add item to cart (authenticated)
app.post('/api/cart/add', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { productId, quantity: rawQty, size } = req.body;
        const quantity = Number(rawQty) || 1;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Valid Product ID required' });
        }

        if (quantity < 1 || quantity > 99 || !Number.isInteger(quantity)) {
            return res.status(400).json({ message: 'Quantity must be between 1 and 99' });
        }

        const validSizes = ['8ml', '50ml', '100ml'];
        if (size && !validSizes.includes(size)) {
            return res.status(400).json({ message: 'Invalid size' });
        }

        const product = await Product.findById(productId).lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check stock: variant-specific if size provided, otherwise top-level
        if (size && product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => v.size === size);
            if (variant && variant.stock === 0) {
                return res.status(400).json({ message: 'This size is sold out' });
            }
        } else if (product.stock === 0) {
            return res.status(400).json({ message: 'This product is sold out' });
        }

        let cart = await Cart.findOne({ userId: req.user.id });
        const itemSize = size || null;

        if (!cart) {
            cart = new Cart({
                userId: req.user.id,
                items: [{ productId, quantity, size: itemSize }]
            });
        } else {
            const existingItem = cart.items.find(
                item => item.productId.toString() === productId
                     && (item.size || null) === itemSize
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ productId, quantity, size: itemSize });
            }
            cart.updatedAt = new Date();
        }

        await cart.save();

        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        res.status(200).json({ message: 'Added to cart', totalItems });
    } catch (error) {
        console.error("Cart add error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Update item quantity (authenticated)
app.put('/api/cart/update', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { productId, quantity, size } = req.body;
        const itemSize = size || null;

        if (!productId || quantity == null) {
            return res.status(400).json({ message: 'Product ID and quantity required' });
        }

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        if (quantity <= 0) {
            cart.items = cart.items.filter(
                item => !(item.productId.toString() === productId
                       && (item.size || null) === itemSize)
            );
        } else {
            const item = cart.items.find(
                item => item.productId.toString() === productId
                     && (item.size || null) === itemSize
            );
            if (item) {
                item.quantity = quantity;
            }
        }

        cart.updatedAt = new Date();
        await cart.save();

        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        res.status(200).json({ message: 'Cart updated', totalItems });
    } catch (error) {
        console.error("Cart update error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Remove item from cart (authenticated)
app.delete('/api/cart/remove/:productId', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { productId } = req.params;
        const itemSize = req.query.size || null;

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => !(item.productId.toString() === productId
                   && (item.size || null) === itemSize)
        );
        cart.updatedAt = new Date();
        await cart.save();

        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        res.status(200).json({ message: 'Item removed', totalItems });
    } catch (error) {
        console.error("Cart remove error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Clear entire cart (authenticated)
app.delete('/api/cart/clear', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        await Cart.findOneAndDelete({ userId: req.user.id });
        res.status(200).json({ message: 'Cart cleared', totalItems: 0 });
    } catch (error) {
        console.error("Cart clear error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Order Routes

// Create order from cart
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { shippingAddress, paymentMethod, razorpayPaymentId, razorpayOrderId } = req.body;

        if (!shippingAddress || !paymentMethod) {
            return res.status(400).json({ message: 'Shipping address and payment method required' });
        }

        const { fullName, phone, address, city, state, pincode } = shippingAddress;
        if (!fullName || !phone || !address || !city || !state || !pincode) {
            return res.status(400).json({ message: 'All shipping address fields are required' });
        }

        // Validate field types and lengths
        if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
            return res.status(400).json({ message: 'Full name must be 2-100 characters' });
        }
        if (typeof address !== 'string' || address.trim().length < 5 || address.trim().length > 500) {
            return res.status(400).json({ message: 'Address must be 5-500 characters' });
        }
        if (typeof city !== 'string' || city.trim().length < 2 || city.trim().length > 50) {
            return res.status(400).json({ message: 'City must be 2-50 characters' });
        }
        if (typeof state !== 'string' || state.trim().length < 2 || state.trim().length > 50) {
            return res.status(400).json({ message: 'State must be 2-50 characters' });
        }

        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ message: 'Phone number must be 10 digits' });
        }

        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ message: 'Pincode must be 6 digits' });
        }

        // Get customer email from their account
        const orderUser = await User.findById(req.user.id).select('email').lean();
        const customerEmail = orderUser?.email || null;

        // Fetch user's cart with product details
        const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Build order items snapshot (resolve variant price/image)
        const orderItems = cart.items
            .filter(item => item.productId != null)
            .map(item => {
                const product = item.productId;
                let price = product.price;
                let image = product.image;

                if (item.size && product.variants && product.variants.length > 0) {
                    const variant = product.variants.find(v => v.size === item.size);
                    if (variant) {
                        price = variant.price;
                        image = variant.image || product.image;
                    }
                }

                return {
                    productId: product._id,
                    name: product.name,
                    size: item.size || null,
                    price,
                    quantity: item.quantity,
                    image
                };
            });

        const totalAmount = orderItems.reduce(
            (sum, item) => sum + (item.price * item.quantity), 0
        );

        const order = new Order({
            userId: req.user.id,
            items: orderItems,
            totalAmount,
            shippingAddress: { fullName, phone, address, city, state, pincode },
            customerEmail: customerEmail || null,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
            razorpayPaymentId: razorpayPaymentId || null,
            razorpayOrderId: razorpayOrderId || null
        });

        await order.save();

        // Clear cart after successful order
        await Cart.findOneAndDelete({ userId: req.user.id });

        // Send email notifications (non-blocking)
        console.log(`📦 Order #${order._id.toString().slice(-8).toUpperCase()} placed — customer email: ${order.customerEmail || 'none'}`);
        sendOrderEmails(order);

        res.status(201).json({
            message: 'Order placed successfully',
            orderId: order._id,
            order
        });
    } catch (error) {
        console.error("Order create error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get user's order history
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const orders = await Order.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(orders);
    } catch (error) {
        console.error("Orders fetch error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get single order details
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findOne({ _id: id, userId: req.user.id }).lean();
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error("Order fetch error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Review Routes

// Get reviews for a product (public)
app.get('/api/reviews/:productId', async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { productId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).lean();
        res.status(200).json(reviews);
    } catch (error) {
        console.error("Reviews fetch error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Create a review (authenticated, one per user per product)
app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: "Database not connected" });
        }

        const { productId, rating, comment } = req.body;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Valid product ID required' });
        }

        const ratingNum = Number(rating);
        if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ message: 'Rating must be 1-5' });
        }

        if (!comment || typeof comment !== 'string' || comment.trim().length < 1 || comment.trim().length > 500) {
            return res.status(400).json({ message: 'Comment must be 1-500 characters' });
        }

        // Verify product exists
        const product = await Product.findById(productId).lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const review = new Review({
            productId,
            userId: req.user.id,
            userName: req.user.name,
            rating: ratingNum,
            comment: comment.trim()
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        // Handle duplicate review (compound unique index)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'You have already reviewed this product' });
        }
        console.error("Review create error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Newsletter subscribe
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        if (!isConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        await Newsletter.create({ email });
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(200).json({ message: 'Subscribed successfully' });
        }
        console.error('Newsletter subscribe error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Razorpay Payment Routes

// Create Razorpay order
app.post('/api/payment/create-order', authenticateToken, async (req, res) => {
    try {
        if (!razorpayInstance) {
            return res.status(503).json({ message: 'Razorpay not configured' });
        }

        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount required' });
        }

        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency: 'INR',
            receipt: `order_${Date.now()}`
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);
        res.status(200).json({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });
    } catch (error) {
        console.error("Razorpay order error:", error.message);
        res.status(500).json({ message: "Payment order creation failed" });
    }
});

// Verify Razorpay payment signature
app.post('/api/payment/verify', authenticateToken, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing payment verification data' });
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Update order payment status in database
            await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { paymentStatus: 'paid', razorpayPaymentId: razorpay_payment_id }
            );
            res.status(200).json({ verified: true });
        } else {
            res.status(400).json({ verified: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error("Payment verify error:", error.message);
        res.status(500).json({ message: "Payment verification failed" });
    }
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    verifyEmailConfig();

    // Keep-alive: ping self every 14 minutes to prevent Render free tier from sleeping
    const RENDER_URL = process.env.RENDER_URL;
    if (RENDER_URL) {
        setInterval(() => {
            fetch(RENDER_URL)
                .then(() => console.log("🏓 Keep-alive ping sent"))
                .catch(() => console.log("⚠️ Keep-alive ping failed"));
        }, 14 * 60 * 1000); // 14 minutes
    }
});
