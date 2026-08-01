const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // lowercase rakha hai taaki "Skirts" aur "skirts" alag na maane
    category: { type: String, required: true, trim: true, lowercase: true },
    price: { type: Number, required: true },
    discountedPrice: { type: Number, default: null },
    description: { type: String, default: '' },
    image: { type: String, required: true }, // Cloudinary ka poora URL yahan store hoga
    // true = homepage (index.html) par bhi dikhega, warna sirf product.html par
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
