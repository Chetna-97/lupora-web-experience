require('dotenv').config(); // MUST be the first line
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(compression()); // gzip responses — reduces payload size significantly
app.use(cors({
    origin: ['http://localhost:5173', 'https://chetna-97.github.io'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// 1. Connection String - uses .env locally, or Environment Variables on GitHub/Hosting
const mongoURI=process.env.MONGO_URI;

if (!mongoURI) {
    console.error("❌ ERROR: MONGO_URI is not defined in environment variables!");
    process.exit(1);
}

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
        console.error("❌ MongoDB Connection Error:");
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        if (err.reason) console.error("Reason:", err.reason);
    });

// 3. Define Schema & Model
const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    image: String,
    price: Number,
    description: String
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

// Media Schema for videos
const mediaSchema = new mongoose.Schema({
    name: String,
    type: String,
    url: String
}, { collection: 'media' });

const Media = mongoose.model('Media', mediaSchema);

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }
}, { collection: 'users', timestamps: true });

const User = mongoose.model('User', userSchema);

// Cart Schema
const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
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
        console.error("🔥 API Error:", error.message);
        console.error("Full error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
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
        res.status(500).json({ message: "Internal Server Error", error: error.message });
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

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email: email.toLowerCase(), password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
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
            user: { id: user._id, name: user.name, email: user.email }
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

        res.status(200).json({ id: user._id, name: user.name, email: user.email });
    } catch (error) {
        console.error("Auth me error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
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

        const totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = validItems.reduce(
            (sum, item) => sum + (item.productId.price || 0) * item.quantity, 0
        );

        res.status(200).json({
            items: validItems.map(item => ({
                productId: item.productId._id,
                name: item.productId.name,
                category: item.productId.category,
                image: item.productId.image,
                price: item.productId.price,
                quantity: item.quantity
            })),
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

        const { productId, quantity = 1 } = req.body;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Valid Product ID required' });
        }

        const product = await Product.findById(productId).lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let cart = await Cart.findOne({ userId: req.user.id });

        if (!cart) {
            cart = new Cart({
                userId: req.user.id,
                items: [{ productId, quantity }]
            });
        } else {
            const existingItem = cart.items.find(
                item => item.productId.toString() === productId
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ productId, quantity });
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

        const { productId, quantity } = req.body;

        if (!productId || quantity == null) {
            return res.status(400).json({ message: 'Product ID and quantity required' });
        }

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        if (quantity <= 0) {
            cart.items = cart.items.filter(
                item => item.productId.toString() !== productId
            );
        } else {
            const item = cart.items.find(
                item => item.productId.toString() === productId
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

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => item.productId.toString() !== productId
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

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);

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
