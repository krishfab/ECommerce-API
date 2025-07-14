const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order");
const { verify, verifyAdmin } = require("../auth");

// check-out
router.post("/checkout", verify, orderController.checkout);

// get all orders - Admin Only
router.get("/all-orders", verify, verifyAdmin, orderController.getAllOrders);

// get orders - users
router.get("/my-orders", verify, orderController.getMyOrders)


// STRETCH GOAL - TRACK ORDER
router.get("/track/:orderId", verify, orderController.trackOrder);

// UPDATE ORDER STATUS - ADMIN

router.patch("/update-status/:orderId", verify, verifyAdmin, orderController.updateOrderStatus);

// Customer marks their order as received

router.patch("/mark-received/:orderId", verify, orderController.markOrderAsReceived);
module.exports = router;