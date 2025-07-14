const jwt = require("jsonwebtoken");
const User = require("./models/User")
require("dotenv").config();


// Create Access Token
module.exports.createAccessToken = (user) => {
  const data = {
    id: user._id,
    email: user.email,
    isAdmin: user.isAdmin,
  };

  return jwt.sign(data, process.env.JWT_SECRET_KEY, {});
};

// Verify User
module.exports.verify = (req, res, next) => {
  let token = req.headers.authorization;

  if (typeof token === "undefined") {
    return res.status(401).send({ auth: "Failed", message: "No Token Provided" });
  } else {
    // removes "Bearer " - to include only the token
    token = token.slice(7, token.length);

    jwt.verify(token, process.env.JWT_SECRET_KEY, function (err, decodedToken) {
      if (err) {
        return res.status(401).send({
          auth: "Failed",
          message: err.message,
        });
      } else {
        req.user = decodedToken;
        next();
      }
    });
  }
};


// Verify Admin User
module.exports.verifyAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    next();
  } else {
    return res.status(403).send({
      auth: "Failed",
      message: "Action Forbidden",
    });
  }
};

// Error Handler

module.exports.errorHandler = (err, req, res, next) =>{
  const errorMessage = err.message;
  const statusCode = err.status || 500;

  res.status(statusCode).json({
    error: {
      message: errorMessage,
      errorCode: err.code || "SERVER_ERROR",
      details: err.details || null
    }
  })
}