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
  Product.find() // No filter = include active + archived
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

// Search Products

// module.exports.searchProducts = async (req, res) => {
//   try {
//     const { name, minPrice, maxPrice } = req.query;

//     const filter = {};

//     // Search by name (case-insensitive)
//     if (name) {
//       filter.name = { $regex: name, $options: "i" };
//     }

//     // Search by price range
//     if (minPrice || maxPrice) {
//       filter.price = {};
//       if (minPrice) filter.price.$gte = parseFloat(minPrice);
//       if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
//     }

//     const products = await Product.find(filter);

//     if (products.length === 0) {
//       return res.status(404).json({ message: "No products matched the search criteria." });
//     }

//     return res.status(200).json({ results: products });

//   } catch (error) {
//     console.error("Search error:", error);
//     return res.status(500).json({ message: "Server error during product search", error: error.message });
//   }
// };