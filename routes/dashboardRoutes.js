const express = require('express');
const router = express.Router();
const { getTeacherDashboard, getStudentDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/teacher', protect, authorize('Teacher'), getTeacherDashboard);
router.get('/student', protect, authorize('Student'), getStudentDashboard);

module.exports = router;
