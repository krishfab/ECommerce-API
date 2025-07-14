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

// ADD TO CART
module.exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  // Basic validation
  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ message: "Invalid productId or quantity." });
  }

  try {
    // Get the product to retrieve its price
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found or inactive." });
    }

    const productPrice = product.price;

    // Find user's cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create new cart with subtotal
      cart = new Cart({
        userId,
        cartItems: [{
          productId,
          quantity,
          subtotal: quantity * productPrice
        }],
        totalPrice: quantity * productPrice
      });
    } else {
      // Check if the product already exists in cart
      const existingItem = cart.cartItems.find(item =>
        item.productId.toString() === productId
      );

      if (existingItem) {
        // Update quantity and subtotal
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.quantity * productPrice;
      } else {
        // Add new item with subtotal
        cart.cartItems.push({
          productId,
          quantity,
          subtotal: quantity * productPrice
        });
      }

      // Recalculate total price
      cart.totalPrice = cart.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
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

// remove from cart

module.exports.removeItemFromCart = async (req, res) => {
  try{
    // step 1: define user and the productId to be searched for
    const userId = req.user.id;
    const productId = req.params.productId;

    // step 2: create a function to find the user using .findOne
    const cart = await Cart.findOne({ userId });

    // this line of code means if the cart function does not return anything, it will send a 404 status code with a message in json format
    if(!cart){
      return res.status(404).json({ message: `Cart not found for the user`})
    }
    
    // set productIndex that searches the cart.cartItems array to find the index (position) of the cart item where the productId matches the one provided in the request.

    // we compared the converted item.productId string to the route param which is also a string. In this way, we can accurately get the index of the product we're looking for.
    const productIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

    // if productIndex is -1, that means the item wasn't found.
    // we return early to avoid accidentally removing the wrong item from the end of the array.
    if (productIndex === -1) {
    return res.status(404).json({ message: "Product not found in cart" });
}

    // create a function where we remove one item starting at index productIndex.
    const removedItem = cart.cartItems.splice(productIndex, 1)[0];

    // this removes the item's subtotal from the overall cart.totalPrice
    cart.totalPrice -= removedItem.subtotal;

    await cart.save();

    return res.status(200).json({
      message: "Product removed from cart successfully",
      cart
    })
  } catch(err){
    console.error(err);
    return res.status(500).json({ message: "Failed to remove product from cart" })
  }
}

// clear cart

module.exports.clearCart = async (req, res) => {
  const userId = req.user.id;

  if (req.user.isAdmin) {
    return res.status(403).json({ message: "Admins are not allowed to clear cart." });
  }

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }

    // Clear cart items and reset total price
    cart.cartItems = [];
    cart.totalPrice = 0;

    await cart.save();

    return res.status(200).json({ message: "Cart cleared successfully.", cart });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

