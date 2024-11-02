const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,  // Each room should have users
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Middleware to automatically update the `updatedAt` field on save
roomSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Room', roomSchema);
