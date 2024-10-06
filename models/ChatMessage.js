const mongoose = require('mongoose');

// Define a schema for chat messages
const chatMessageSchema = new mongoose.Schema({
  username: String,      // The user sending the message
  message: String,       // The message content
  timestamp: {           // The time when the message was sent
    type: Date,
    default: Date.now
  }
});

// Create a model based on the schema
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
