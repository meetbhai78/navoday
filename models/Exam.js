const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['Online', 'Offline'], required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village' }, // Optional: specific to a village or global
  date: { type: Date, required: true },
  time: { type: String, default: '' },
  durationMinutes: { type: Number, default: 0 }, // For online exams
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  questions: [{
    questionText: { type: String, required: true },
    type: { type: String, enum: ['MCQ', 'ShortAnswer'], required: true },
    options: [{ type: String }], // If MCQ
    correctOptionIndex: { type: Number }, // If MCQ, 0-indexed
    marks: { type: Number, required: true }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);
