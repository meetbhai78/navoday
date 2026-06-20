const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scope: { type: String, enum: ['Individual', 'Village', 'Global'], required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If Individual
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village' }, // If Village-wide
  content: { type: String, required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of students who read it
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
