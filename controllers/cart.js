const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { errorHandler } = require("../auth");


// get user cart
module.exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const carts = await Cart.findOne({ userId }).populate("cartItems.productId");

    if (!carts) {
      return res.status(404).json({ message: "Cart not found" });
    }

    let totalPrice = 0;

    const cartItemsWithSubtotal = carts.cartItems.map((item) => {
      const price = item.productId?.price || 0;
      const subtotal = item.quantity * price;
      totalPrice += subtotal;

      return {
        _id: item._id,
        productId: item.productId._id,
        quantity: item.quantity,
        subtotal: subtotal,
      };
    });

    const response = {
      carts: {
        _id: carts._id,
        userId: carts.userId,
        cartItems: cartItemsWithSubtotal,
        totalPrice: totalPrice,
        orderedOn: carts.orderedOn,
        __v: carts.__v,
      },
    };

    return res.status(200).json(response);

  } catch (error) {
    return errorHandler(error, req, res);
  }
};

module.exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  // Basic validation
  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ message: "Invalid productId or quantity." });
  }

  try {
    // Optional: verify that product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Find user's cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // No cart exists, create a new one
      cart = new Cart({
        userId,
        cartItems: [{ productId, quantity }],
      });
    } else {
      // Check if the item already exists in cart
      const existingItem = cart.cartItems.find(item =>
        item.productId.toString() === productId
      );

      if (existingItem) {
        // If it exists, update the quantity
        existingItem.quantity += quantity;
      } else {
        // Else, push new item
        cart.cartItems.push({ productId, quantity });
      }
    }

    await cart.save();
    return res.status(200).json({ message: "Product added to cart", cart });

  } catch (err) {
    console.error("Error adding to cart:", err);
    return res.status(500).json({ message: "Server error while adding to cart" });
  }
};

module.exports.updateCartQuantity = async (req, res) => {
  const userId = req.user.id;
  const { productId, newQuantity } = req.body;

  if (!productId || newQuantity === undefined || newQuantity < 0) {
    return res.status(400).json({ message: "Invalid productId or quantity." });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found." });

    const itemIndex = cart.cartItems.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart." });
    }

    if (newQuantity === 0) {
      // Remove item from cart if quantity is 0
      cart.cartItems.splice(itemIndex, 1);
    } else {
      // Update quantity and subtotal
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }

      cart.cartItems[itemIndex].quantity = newQuantity;
      cart.cartItems[itemIndex].subtotal = product.price * newQuantity;
    }

    // Recalculate totalPrice
    cart.totalPrice = cart.cartItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    await cart.save();

    res.status(200).json({
      message:
        newQuantity === 0
          ? "Item removed from cart."
          : "Cart item quantity updated.",
      cart,
    });
  } catch (err) {
    console.error("Update quantity error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// clear cart

// module.exports.clearCart = async (req, res) => {
//   const userId = req.user.id;

//   if (req.user.isAdmin) {
//     return res.status(403).json({ message: "Admins are not allowed to clear cart." });
//   }

//   try {
//     const cart = await Cart.findOne({ userId });

//     if (!cart) {
//       return res.status(404).json({ message: "Cart not found." });
//     }

//     // Clear cart items and reset total price
//     cart.cartItems = [];
//     cart.totalPrice = 0;

//     await cart.save();

//     return res.status(200).json({ message: "Cart cleared successfully.", cart });
//   } catch (error) {
//     return errorHandler(error, req, res);
//   }
// };