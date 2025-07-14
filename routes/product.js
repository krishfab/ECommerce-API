const express = require("express");
const router = express.Router();
const productController = require("../controllers/product");
const { verify, verifyAdmin } = require("../auth");

// Create product - Admin Access only

router.post("/", verify, verifyAdmin, productController.createProduct);

// Get all product - Admin only

router.get("/all", verify, verifyAdmin, productController.getAllProducts);

// Public Access - Get all active products

router.get("/active", productController.getAllActiveProducts);

// retrieve - specific product

router.get("/:productId", productController.getProductById);

// update product

router.patch('/:productId/update', verify, verifyAdmin, productController.updateProduct);

// archive product

router.patch('/:productId/archive', verify, verifyAdmin, productController.archiveProduct);

// activate product

router.patch('/:productId/activate', verify, verifyAdmin, productController.activateProduct);

// Search products by name
router.post("/search-by-name",  productController.searchByName);

// Search products by price range
router.post("/search-by-price",  productController.searchByPrice);

module.exports = router;