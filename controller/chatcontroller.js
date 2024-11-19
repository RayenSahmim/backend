// backend/controller/chatcontroller.js
const axios = require('axios');
const FormData = require('form-data'); // Import the FormData library for Node.js
const User = require('../models/User');
const RoomModel = require('../models/Room'); // New Room model

const uploadImage = async (req, res) => {
  // Check if a file is uploaded
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    // Prepare form data for cloud server
    const formData = new FormData();
    formData.append('image', req.file.buffer, req.file.originalname);

    // Send form data to cloud server
    const response = await axios.post(
      "https://image-storage-um9c.onrender.com/upload", 
      formData, 
      { headers: { ...formData.getHeaders() } }
    );
    // Handle response from cloud server
    if (response.status === 200) {
      const result = await User.findOneAndUpdate(
        { _id: req.session.user.id },
        { ImageURL: response.data.filePath },
        { new: true }
      );
      console.log('Image uploaded to cloud server:', result.ImageURL);
      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        url: response.data.filePath
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to upload to cloud server' 
      });
    }
  } catch (error) {
    console.error('Error uploading to cloud server:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during upload' 
    });
  }
};

const getRommById = async (req, res) => {
  try {
    const roomId = req.params.roomId;

    // Find the room by ID and populate the 'users' field
    const room = await RoomModel.findById(roomId).populate('users');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user by ID and update their name
    const updatedUser = await User.findByIdAndUpdate(userId, { name: req.body.name }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { uploadImage, getRommById, getUserById, updateUser };
