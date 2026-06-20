const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  marksObtained: { type: Number, required: true },
  isPassed: { type: Boolean, required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selectedOptionIndex: { type: Number },
    answerText: { type: String },
    marksAwarded: { type: Number }
  }],
  published: { type: Boolean, default: false }, // Only visible to student when published is true
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);
