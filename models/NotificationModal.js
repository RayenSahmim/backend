const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Recipient
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Sender
  type: { type: String, required: true }, // e.g., "message", "call", "friend_request"
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

module.exports = mongoose.model('Notification', NotificationSchema);
