const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cartItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 },
      subtotal: { type: Number, default: 0 } 
    }
  ],
  totalPrice: { type: Number, default: 0 },
  orderedOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Cart", cartSchema)