const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart");
const { verify, verifyAdmin } = require("../auth");

// add your codes here

// get cart

router.get("/get-cart", verify, cartController.getCart);

// add to cart route
router.post("/add-to-cart", verify, cartController.addToCart);

// update cart quantity
router.patch("/update-cart-quantity", verify, cartController.updateCartQuantity);

// clear cart - krisha

// router.delete("/clear-cart", verify, cartController.clearCart);

module.exports = router;