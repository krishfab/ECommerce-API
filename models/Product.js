const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  batch_number: {type: String}
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);