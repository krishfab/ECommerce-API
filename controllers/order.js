const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
// const QRCode = require("qrcode")

module.exports.checkout = async (req, res) => {
  const userId = req.user.id;

  if (req.user.isAdmin) {
    return res.status(403).json({ message: "Admins are not allowed to checkout." });
  }

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "No cart found for the current user." });
    }

    if (cart.cartItems.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }

    const detailedItems = await Promise.all(
      cart.cartItems.map(async (item) => {
        const product = await Product.findById(item.productId);

        if (!product || !product.isActive) {
          throw new Error(`Product ${item.productId} is invalid or inactive.`);
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          subtotal: item.subtotal 
        };
      })
    );

    const order = new Order({
      userId,
      customerInfo: null,
      items: detailedItems,
      totalAmount: cart.totalPrice,
      isGuest: false
    });

    await order.save();

    cart.cartItems = [];
    cart.totalPrice = 0;
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Checkout successful. Order placed.",
      order
    });

  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({
      success: false,
      message: "Checkout failed.",
      error: error.message
    });
  }
};

// Get all orders - Admin only

module.exports.getAllOrders = async (req, res) => {
  // Only allow admin access
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  try {
    const orders = await Order.find().populate("userId", "firstName lastName email").populate("items.productId", "name price");

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error("Error retrieving orders:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// get user's orders

module.exports.getMyOrders = async (req, res) => {
  const userId = req.user.id;

  try{
    const orders = await Order.find({ userId }).populate("items.productId", "name price").sort({ createdAt: -1 });

    if(!orders || orders.length === 0){
      return res.status(404).json({ message: "No orders placed"})
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    })
  } catch(err){
    console.error("Error retrieving user orders", err);
    return res.status(500).json({ message: "Server Error", error: err.message})
  }
}

// ADDITIONAL FUNCTION - STRETCH GOAL TRACK ORDER

module.exports.trackOrder = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId).populate("userId", "firstName lastName email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Order is currently ${order.status}`,
      order: {
        orderId: order._id,
        user: order.userId,
        status: order.status,
        products: order.products,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin - Update the order's status

module.exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const rawStatus  = req.body.status;

  const status = typeof rawStatus === "string" ? rawStatus.trim().toLowerCase() : "";

  const allowedStatus = ["pending", "processing", "for delivery", "delivered", "cancelled"];

  // Validate status
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: `Order status updated to ${status}`,
      updatedOrder
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// User - mark the item as received

module.exports.markOrderAsReceived = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const currentStatus = order.status.trim().toLowerCase();

    if (currentStatus !== "for delivery") {
      return res.status(400).json({
        message: `Cannot mark order as received. Current status: "${order.status}"`
      });
    }

    order.status = "delivered";
    await order.save();

    return res.status(200).json({
      message: "Order marked as received",
      updatedOrder: order
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};