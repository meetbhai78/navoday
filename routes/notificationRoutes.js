const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe
} = require('../controllers/notificationController');

// GET /api/notifications/vapid-public-key  (public - needed before login to setup SW)
router.get('/vapid-public-key', getVapidPublicKey);

// POST /api/notifications/subscribe  (private - student saves their push subscription)
router.post('/subscribe', protect, subscribe);

// POST /api/notifications/unsubscribe  (private - remove subscription)
router.post('/unsubscribe', protect, unsubscribe);

module.exports = router;
