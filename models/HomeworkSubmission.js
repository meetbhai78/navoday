const mongoose = require('mongoose');

const homeworkSubmissionSchema = new mongoose.Schema({
  homeworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Submitted', 'Pending', 'Graded'], default: 'Submitted' },
  remarks: { type: String, default: '' }
});

module.exports = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
