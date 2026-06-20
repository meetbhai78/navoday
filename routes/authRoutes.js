const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginUser,
  getUserProfile,
  changeLanguage,
  changePassword,
  getPublicVillages,
  getPublicClasses,
  getPublicStudents
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register-student', registerStudent);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/language', protect, changeLanguage);
router.put('/password', protect, changePassword);
router.get('/villages', getPublicVillages);
router.get('/classes', getPublicClasses);
router.get('/students', protect, getPublicStudents);

module.exports = router;
