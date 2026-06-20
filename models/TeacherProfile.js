const mongoose = require('mongoose');

const teacherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  villageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Village' }],
  specialization: { type: String, default: '' }
});

module.exports = mongoose.model('TeacherProfile', teacherProfileSchema);
