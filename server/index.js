require('dotenv').config(); // MUST be the first line
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://chetna-97.github.io'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
    image: String
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

// Media Schema for videos
const mediaSchema = new mongoose.Schema({
    name: String,
    type: String,
    url: String
}, { collection: 'media' });

const Media = mongoose.model('Media', mediaSchema);

// 4. API Routes
// Health check route
app.get('/', (req, res) => res.send("Lupora Server is Running..."));

// Fetch products route
app.get('/api/products', async (req, res) => {
    try {
        // Check if MongoDB is connected
        if (!isConnected) {
            console.error("🔥 Database not connected yet");
            return res.status(503).json({ message: "Database not connected" });
        }

        console.log("📦 Fetching products from database...");
        const products = await Product.find().lean();
        console.log(`✅ Found ${products.length} products`);
        res.status(200).json(products);
    } catch (error) {
        console.error("🔥 API Error:", error.message);
        console.error("Full error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Fetch media/videos route
app.get('/api/media', async (req, res) => {
    try {
        if (!isConnected) {
            console.error("🔥 Database not connected yet");
            return res.status(503).json({ message: "Database not connected" });
        }

        console.log("🎬 Fetching media from database...");
        const media = await Media.find().lean();
        console.log(`✅ Found ${media.length} media items`);
        res.status(200).json(media);
    } catch (error) {
        console.error("🔥 API Error:", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});