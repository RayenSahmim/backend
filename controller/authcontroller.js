const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authenticateJWT = require("../middleware/authMiddleware");
require("dotenv").config();

const registerUser = async (req, res) => {
  let { name, email, password } = req.body;

  // Check if all fields are present
  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({ name, email, password: hashedPassword });
    await user.save();

    res
      .status(200)
      .json({
        message: "User registered successfully",
        user: { name: user.name, email: user.email },
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const Login = async (req, res) => {
  const { email, password } = req.body;

  // Check if all fields are present
  if (!email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User does not exist" });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // Create a session and store user info in it
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    // Return success message
    res.status(200).json({
      message: "Login successful",
      user: { name: user.name, email: user.email },
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const Logout = (req, res) => {
  // Destroy the session and clear the user data
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ message: 'Failed to logout' });
    }

    // Optionally, clear the cookie (if applicable)
    res.clearCookie('connect.sid', { path: '/' });

    // Send a success message
    res.status(200).json({ message: 'Logout successful' });
  });
};



const checkSession =  (req, res) => {
  if (req.session.user) {
    res.status(200).json({ user: req.session.user });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
}


const dashboard = (req, res) => {
  res.status(200).json({ message: "Dashboard" });
};
module.exports = {
  registerUser,
  Login,
  Logout,
  checkSession,
  dashboard,
};
