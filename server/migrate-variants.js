/**
 * One-time migration: add variants array to existing products.
 * Sets 50ml = current price/image, 8ml and 100ml get placeholder prices.
 * Update prices manually in MongoDB afterwards.
 *
 * Usage:
 *   cd server
 *   node migrate-variants.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error('MONGO_URI not found in .env');
  process.exit(1);
}

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  originalPrice: Number,
  image: String,
  stock: Number,
  variants: [{
    size: String,
    price: Number,
    originalPrice: Number,
    image: String,
    stock: Number
  }]
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

async function migrate() {
  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');

    // Find products without variants
    const products = await Product.find({
      $or: [{ variants: { $exists: false } }, { variants: { $size: 0 } }]
    });

    console.log(`Found ${products.length} products without variants`);

    if (products.length === 0) {
      console.log('All products already have variants — nothing to do.');
    } else {
      for (const product of products) {
        const basePrice = product.price;
        const baseOriginalPrice = product.originalPrice || null;
        const baseImage = product.image || '';

        const variants = [
          {
            size: '8ml',
            price: basePrice,             // placeholder — update manually
            originalPrice: baseOriginalPrice,
            image: baseImage,             // same image for now
            stock: -1
          },
          {
            size: '50ml',
            price: basePrice,
            originalPrice: baseOriginalPrice,
            image: baseImage,
            stock: -1
          },
          {
            size: '100ml',
            price: basePrice,             // placeholder — update manually
            originalPrice: baseOriginalPrice,
            image: baseImage,             // same image for now
            stock: -1
          }
        ];

        await Product.updateOne(
          { _id: product._id },
          { $set: { variants } }
        );
        console.log(`  ${product.name} → 3 variants added (all set to ₹${basePrice} — update 8ml/100ml prices manually)`);
      }
    }

    const total = await Product.countDocuments();
    console.log(`\nTotal products in database: ${total}`);
    console.log('Done! Update 8ml and 100ml prices in MongoDB.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
