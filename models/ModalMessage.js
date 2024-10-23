const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
  room: String, // Room ID for the private chat
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }, // Automatically adds a timestamp
});

const MessageModal = mongoose.model('Message', messageSchema);
module.exports = MessageModal;
