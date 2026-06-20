const express = require('express');
const router = express.Router();
const {
  createExam,
  getExams,
  getExamById,
  submitOnlineExam,
  enterOfflineMarks,
  publishResults,
  getExamResults,
  getStudentReportCard
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('Admin', 'Teacher'), createExam)
  .get(protect, getExams);

router.get('/student/:studentId/report-card', protect, getStudentReportCard);

router.route('/:id')
  .get(protect, getExamById);

router.post('/:id/submit', protect, authorize('Student'), submitOnlineExam);
router.post('/:id/marks', protect, authorize('Admin', 'Teacher'), enterOfflineMarks);
router.put('/:id/publish', protect, authorize('Admin', 'Teacher'), publishResults);
router.get('/:id/results', protect, getExamResults);

module.exports = router;
