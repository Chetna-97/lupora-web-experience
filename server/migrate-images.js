// One-time migration script: update .png image references to .webp in MongoDB
// Run with: node migrate-images.js

require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  image: String
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

async function migrate() {
  await mongoose.connect(mongoURI);
  console.log("Connected to MongoDB");

  const products = await Product.find({ image: /\.png$/ });
  console.log(`Found ${products.length} products with .png images`);

  for (const product of products) {
    const newImage = product.image.replace(/\.png$/, '.webp');
    await Product.updateOne({ _id: product._id }, { $set: { image: newImage } });
    console.log(`Updated: ${product.name} -> ${newImage}`);
  }

  console.log("Migration complete!");
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
