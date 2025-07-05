
// [SECTION] Dependencies and Modules
const express = require("express");
const mongoose = require("mongoose");

const cors = require("cors");

const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
// const enrollmentRoutes = require("./routes/enrollment"); // <<

// const passport = require("passport"); // passport package
// require("./passport") // passport file
// const session = require("express-session"); // <<

// [SECTION] Environment Setup
// const port = 4000;
require("dotenv").config();

// [SECTION] Server Setup
const app = express();
// To parse json data.
app.use(express.json());
const corsOptions = {
  origin: ['http://localhost:8000'],
  credentials: true, 
  optionsSuccessStatus: 200,
}

app.use(cors());

// // setup the session middleware to store user info in the server's session
// app.use(session({
//   secret: process.env.clientSecret,
//   resave: false, // no need to save the session again if it hasn't change
//   saveUninitialized: false // no need to save empty sessions
// }));

// // initializes the passport package when the application runs
// app.use(passport.initialize());

// // create the session using passport package
// app.use(passport.session());

// [SECTION] Database Connection
// Connect to our MongoDB database
mongoose.connect(process.env.MONGODB_STRING);
// Prompts a message in the terminal once the connection is "open" and we are able to successfully connect to the database
mongoose.connection.once("open", () => console.log("Now connected to MongoDB Atlas."));

app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
// app.use("/enrollment", enrollmentRoutes); // <<

// [SECTION] Sever Gateway Response
if(require.main === module) {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`API is now online on port ${ process.env.PORT || 3000}`)
  })
}

// exports an object containing the value of the "app" variable only used for grading
module.exports = { app, mongoose };
