// One-time migration script: add price and description to existing products
// Run with: node migrate-prices.js

require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    image: String,
    price: Number,
    description: String
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

const priceData = {
    'Flora Divina': { price: 4500, description: 'A luminous bouquet of rare florals, capturing the essence of an eternal garden.' },
    'Midnight Elixir': { price: 5200, description: 'A mysterious blend of dark woods and spices, evoking the allure of midnight.' },
    'Oud Mystique': { price: 6800, description: 'Precious oud intertwined with amber and saffron, a scent of timeless opulence.' },
    'Velvet Rose': { price: 4800, description: 'Velvety Bulgarian rose layered with musk, an ode to romantic elegance.' },
    'Amber Noir': { price: 5500, description: 'Rich amber meets smoky vetiver, a bold signature for the discerning soul.' }
};

async function migrate() {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    for (const [name, data] of Object.entries(priceData)) {
        const result = await Product.updateOne(
            { name },
            { $set: { price: data.price, description: data.description } }
        );
        if (result.modifiedCount > 0) {
            console.log(`Updated: ${name} -> ₹${data.price}`);
        } else {
            console.log(`Not found or already updated: ${name}`);
        }
    }

    console.log("Price migration complete!");
    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
