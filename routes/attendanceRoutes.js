const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getStudentsForAttendance,
  getStudentAttendanceHistory,
  getAttendanceReport
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// Student attendance history can be fetched by students (for themselves) or teacher/admin
router.get('/student/:studentId', protect, getStudentAttendanceHistory);

// Admin or Teacher only routes
router.post('/mark', protect, authorize('Admin', 'Teacher'), markAttendance);
router.get('/list', protect, authorize('Admin', 'Teacher'), getStudentsForAttendance);
router.get('/report', protect, authorize('Admin', 'Teacher'), getAttendanceReport);

module.exports = router;
