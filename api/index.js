const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const Product = require('../models/Product');

const app = express();
const ADMIN_KEY = process.env.ADMIN_KEY || 'INDIANI@2025';

app.use(cors({ origin: '*' }));
app.use(express.json());

/* ---------------- CLOUDINARY ---------------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'Indiani_way', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] }
});
const upload = multer({ storage });

/* ---------------- MONGODB (cached connection for serverless) ---------------- */
const MONGO_URI = process.env.ATLAS_URI;
console.log('URI check:', MONGO_URI ? 'FOUND' : 'MISSING');

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, { dbName: 'indianway' }).then((m) => m);
  }
  cached.conn = await cached.promise;
  console.log('MongoDB Connected SUCCESS');
  return cached.conn;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    console.log('MongoDB Error:', e.message);
    res.status(500).json({ error: 'Database connection failed', details: e.message });
  }
});

/* ---------------- ADMIN KEY CHECK ---------------- */
function checkAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key === ADMIN_KEY) next();
  else res.status(403).json({ message: 'Access Denied - galat key' });
}

/* ================= ROUTES ================= */

app.get('/', (req, res) => res.send('Indiani Way Backend is Live!'));

// 1. Public - saare products, ya sirf featured (?featured=true) - homepage ke liye
app.get('/api/products', async (req, res) => {
  try {
    const filter = req.query.featured === 'true' ? { isFeatured: true } : {};
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Private - Add product
app.post('/api/products', checkAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, discountedPrice, description, isFeatured } = req.body;
    const newProduct = new Product({
      name: (name || '').trim(),
      category: (category || '').trim().toLowerCase(),
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : null,
      description: description || '',
      image: req.file ? req.file.path : 'https://via.placeholder.com/400x500?text=No+Image',
      isFeatured: isFeatured === 'true' || isFeatured === true
    });
    await newProduct.save();
    res.json({ message: 'Product Added', product: newProduct });
  } catch (err) {
    console.log('SAVE ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Private - Update product
app.put('/api/products/:id', checkAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, discountedPrice, description, isFeatured } = req.body;
    const updateData = {
      name: (name || '').trim(),
      category: (category || '').trim().toLowerCase(),
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : null,
      description: description || '',
      isFeatured: isFeatured === 'true' || isFeatured === true
    };
    if (req.file) updateData.image = req.file.path;

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Private - Delete product
app.delete('/api/products/:id', checkAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- LOCAL RUN vs VERCEL ---------------- */
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running locally: http://localhost:${PORT}`));
}

module.exports = app;
