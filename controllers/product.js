const Product = require("../models/Product");
const { errorHandler } = require("../auth");

// create product - Krisha

module.exports.createProduct = (req, res) => {
  const { name, description, price, stock } = req.body;

  if (!name || !description || typeof price !== "number") {
    return res.status(400).send({
      success: false,
      message: "All fields are required and must be valid",
    });
  }

  const newProduct = new Product({
    name,
    description,
    price,
    stock,
    isActive: true,
  });

  return newProduct
    .save()
    .then((result) => {
      return res.status(201).send({
        success: true,
        message: "Product created successfully",
        data: result,
      });
    })
    .catch((error) => errorHandler(error, req, res));
};

// Retrieve all product

module.exports.getAllProducts = (req, res) => {

    if (!req.user.isAdmin) {
    return res.status(401).json({ message: "Forbidden: Admins only" });
  }
  
  Product.find() 
    .then((products) => {
      if (!products || products.length === 0) {
        return res.status(404).send({
          success: false,
          message: "No products found",
        });
      }

      return res.status(200).send(products);
    })
    .catch((error) => errorHandler(error, req, res));
};

// Get all active products

module.exports.getAllActiveProducts = (req, res) => {
  Product.find({ isActive: true })
    .then((products) => {
      if (!products || products.length === 0) {
        return res.status(404).send({
          success: false,
          message: "No active products found",
        });
      }

      return res.status(200).send(products);
    })
    .catch((error) => errorHandler(error, req, res));
};

// Retrieve Specific Product

module.exports.getProductById = (req, res) => {
  const productId = req.params.productId;

  if (!productId) {
    return res.status(400).send({
      success: false,
      message: "Product ID is required",
    });
  }

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return res.status(404).send({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).send(product);
    })
    .catch((error) => errorHandler(error, req, res));
};

// update product
module.exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const updates = req.body;

    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unable to update product. User is not an admin." });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updates,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

// archive product

module.exports.archiveProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const archivedProduct = await Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { new: true }
    );

    if (!archivedProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json(archivedProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to archive product", error: error.message });
  }
};



// Activate Product

module.exports.activateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const activatedProduct = await Product.findByIdAndUpdate(
      productId,
      { isActive: true },
      { new: true }
    );

    if (!activatedProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json(activatedProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to activate product", error: error.message });
  }
};

//Search Products

// 1 - search by name
module.exports.searchByName = async (req, res) => {
  try {
    const { name } = req.body; // ⬅️ changed from req.query

    if (!name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const products = await Product.find({
      name: { $regex: name, $options: "i" },
      isActive: true,
    });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    return res.status(200).json({ success: true, data: products });

  } catch (error) {
    return errorHandler(error, req, res);
  }
};
// 2- search by price

module.exports.searchByPrice = async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.body;

    if (!minPrice && !maxPrice) {
      return res.status(400).json({ message: "Price range is required" });
    }

    const priceFilter = {};
    if (minPrice) priceFilter.$gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);

    const products = await Product.find({
      price: priceFilter,
      isActive: true,
    });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this price range" });
    }

    return res.status(200).json({ success: true, data: products });

  } catch (error) {
    return errorHandler(error, req, res);
  }
};