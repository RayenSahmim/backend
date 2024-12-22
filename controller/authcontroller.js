const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authenticateJWT = require("../middleware/authMiddleware");
require("dotenv").config();
const RoomModel = require('../models/Room'); // New Room model
const { encrypt , decrypt } = require("../utils/crypto");

const registerUser = async (req, res) => {
  let { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  try {
    let user = await User.findOne({ email: encrypt(email) }); // Store encrypted email
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({ 
      name : encrypt(name), 
      email: encrypt(email), // Encrypt email before saving
      password: hashedPassword 
    });
    await user.save();

    res.status(200).json({
      message: "User registered successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const Login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  try {
    
    let user = await User.findOne({email: encrypt(email)}); // Store encrypted email
    if (!user) {
      return res.status(404).json({ encryptedEmail: encrypt(email), email: email, msg: "User does not exist" });
    }
    const decryptedEmail = decrypt(user.email);

    

    // Decrypt stored email and compare
    const decryptedName = decrypt(user.name);
    if (decryptedEmail !== email) {
      return res.status(404).json({ msg: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    req.session.user = {
      id: user._id,
      name: decryptedName,
      email: decryptedEmail,
    };

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, name: decryptedName, email: decryptedEmail },
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





const GetRooms = async (req, res) => {
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const search = req.query.search || ""; // Get the search term from query params, default to empty

  try {
    // Fetch rooms where the user is a member
    const rooms = await RoomModel.find({ users: userId }).populate('users');

    // Decrypt and filter users based on search term
    const filteredRooms = rooms.map((room) => {
      const decryptedUsers = room.users.map((user) => ({
        ...user.toObject(),
        name: decrypt(user.name), // Decrypt each user's name
        email: decrypt(user.email)
      }));

      // Filter users based on the search term
      const matchingUsers = decryptedUsers.filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase())
      );

      // Return the room with filtered users
      return {
        ...room.toObject(),
        users: matchingUsers,
      };
    }).filter((room) => room.users.length > 0); // Remove rooms with no matching users

    res.status(200).json(filteredRooms);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};



const AddRoom = async (req, res) => {
  try {
    const {  users } = req.body;

    // Create a new room
    const room = new RoomModel({
      users,  // Array of user IDs
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
}

module.exports = {
  registerUser,
  Login,
  Logout,
  checkSession,
  GetRooms,
  AddRoom,
};
