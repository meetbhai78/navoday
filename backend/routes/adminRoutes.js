const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getVillages,
  createVillage,
  updateVillage,
  deleteVillage,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAuditLogs
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require Admin role
router.use(protect, authorize('Admin'));

router.get('/dashboard', getDashboardData);

router.route('/villages')
  .get(getVillages)
  .post(createVillage);
router.route('/villages/:id')
  .put(updateVillage)
  .delete(deleteVillage);

router.route('/classes')
  .get(getClasses)
  .post(createClass);
router.route('/classes/:id')
  .put(updateClass)
  .delete(deleteClass);

router.route('/teachers')
  .get(getTeachers)
  .post(createTeacher);
router.route('/teachers/:id')
  .put(updateTeacher)
  .delete(deleteTeacher);

router.route('/students')
  .get(getStudents)
  .post(createStudent);
router.route('/students/:id')
  .put(updateStudent)
  .delete(deleteStudent);

router.get('/audit-logs', getAuditLogs);

module.exports = router;
