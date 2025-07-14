const User = require("../models/User");
const bcrypt = require("bcryptjs");
const auth = require("../auth");
const { errorHandler } = require("../auth");


// Check Email Function
module.exports.checkEmailExist = (req, res) => {
  if (req.body.email.includes("@")) {
    return User.findOne({ email: req.body.email })
      .then((user) => {
        if (user) {
          return res.status(409).send({ message: "Duplicate email found" });
        } else {
          return res.status(404).send({ message: "No duplicate email found" });
        }
      })
      .catch((error) => errorHandler(error, req, res));
  } else {
    return res.status(400).send({ message: "Invalid email format" });
  }
};

const checkEmailExistHelper = (email) => {
  return User.find({ email: email }).then((result) => {
    if (result.lenght > 0) {
      return "duplicate email found";
    } else {
      return false;
    }
  });
};

// Registration - Krisha

module.exports.registerUser = async (req, res) => {
  const { firstName, lastName, email, password, mobileNo } = req.body;

  // Validation
  if (typeof firstName !== "string" || typeof lastName !== "string") {
    return res.status(400).json({ message: "Invalid name format" });
  }

  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  if (typeof mobileNo !== "string" || mobileNo.length !== 11) {
    return res.status(400).json({ message: "Mobile number is invalid" });
  }

  try {
    const emailExists = await checkEmailExistHelper(email);
    
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Create new user
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      mobileNo,
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: savedUser,
    });

  } catch (error) {
    return errorHandler(error || {}, req, res); 
  }
};

// Log-in Krisha
module.exports.loginUser = (req, res) => {
  if (req.body.email.includes("@")) {
    return User.findOne({ email: req.body.email })
      .then((result) => {
        if (result == null) {
          return res.status(404).send({ message: "No email found" });
        } else {
          const isPasswordCorrect = bcrypt.compareSync(
            req.body.password,
            result.password
          );

          if (isPasswordCorrect) {
            return res.status(200).send({
              message: "User logged in successfully",
              access: auth.createAccessToken(result),
            });
          } else {
            return res
              .status(401)
              .send({ message: "Incorrect email or password" });
          }
        }
      })
      .catch((error) => errorHandler(error, req, res));
  } else {
    return res.status(400).send({ message: "Invalid email format" });
  }
};


// Retrieve User Dale
module.exports.retrieveUser = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Set As Admin Dale

module.exports.setAsAdmin = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isAdmin) {
      return res.status(200).json({ message: "User is already an admin" });
    }

    user.isAdmin = true;
    await user.save();
    return res.status(200).json({ message: "User updated to admin successfully" });
    
  } catch (error) {
    console.error("Error in setAsAdmin:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Password
module.exports.updatePassword = async (req, res) => {
	try {
		const userId = req.user.id;
		const { newPassword } = req.body;

		if (!newPassword) {
			return res.status(400).json({ message: "New password is required." });
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);

		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ password: hashedPassword },
			{ new: true }
		);

		if (!updatedUser) {
			return res.status(404).json({ message: "User not found." });
		}

		res.status(200).json({ message: "Password successfully updated." });
	} catch (error) {
		console.error("Password reset error:", error);
		res.status(500).json({ message: "Internal server error." });
	}
};
