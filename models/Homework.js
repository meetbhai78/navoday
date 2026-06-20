const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  subject: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true },
  dueDate: { type: Date, required: true },
  fileUrl: { type: String, default: '' }, // Cloudinary or local uploads path
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Homework', homeworkSchema);
