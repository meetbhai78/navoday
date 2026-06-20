const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  rollNumber: { type: String, default: '' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true },
  guardianName: { type: String, default: '' },
  guardianPhone: { type: String, default: '' }
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
