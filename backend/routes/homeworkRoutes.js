const express = require('express');
const router = express.Router();
const {
  createHomework,
  getHomework,
  deleteHomework,
  submitHomework,
  getSubmissions,
  gradeSubmission,
  createStudyMaterial,
  getStudyMaterials,
  deleteStudyMaterial
} = require('../controllers/homeworkController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Base routes for homework
router.route('/')
  .post(protect, authorize('Admin', 'Teacher'), upload.single('file'), createHomework)
  .get(protect, getHomework);

router.route('/:id')
  .delete(protect, authorize('Admin', 'Teacher'), deleteHomework);

router.post('/:id/submit', protect, authorize('Student'), upload.single('file'), submitHomework);
router.get('/:id/submissions', protect, authorize('Admin', 'Teacher'), getSubmissions);

router.put('/submission/:subId/grade', protect, authorize('Admin', 'Teacher'), gradeSubmission);

// Study Materials routes
router.route('/materials')
  .post(protect, authorize('Admin', 'Teacher'), upload.single('file'), createStudyMaterial)
  .get(protect, getStudyMaterials);

router.route('/materials/:id')
  .delete(protect, authorize('Admin', 'Teacher'), deleteStudyMaterial);

module.exports = router;
