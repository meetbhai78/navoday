const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  markMessageAsRead,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
} = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');

// Message inbox & read states
router.route('/')
  .post(protect, authorize('Admin', 'Teacher'), sendMessage)
  .get(protect, getMessages);

router.put('/:id/read', protect, authorize('Student'), markMessageAsRead);

// Announcements (global dashboard notices)
router.route('/announcements')
  .post(protect, authorize('Admin'), createAnnouncement)
  .get(protect, getAnnouncements);

router.route('/announcements/:id')
  .delete(protect, authorize('Admin'), deleteAnnouncement);

module.exports = router;
