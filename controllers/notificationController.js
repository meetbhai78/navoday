const webpush = require('web-push');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// Setup VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@navoday.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// @desc    Get VAPID Public Key (frontend needs this to subscribe)
// @route   GET /api/notifications/vapid-public-key
// @access  Public
const getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

// @desc    Save push subscription for logged-in user
// @route   POST /api/notifications/subscribe
// @access  Private
const subscribe = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      res.status(400);
      throw new Error('Invalid subscription object');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Remove duplicate subscription with same endpoint (re-subscribe)
    user.pushSubscriptions = user.pushSubscriptions.filter(
      s => s.endpoint !== subscription.endpoint
    );

    // Add new subscription
    user.pushSubscriptions.push({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth
      }
    });

    await user.save();
    res.json({ message: 'Subscription saved successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove push subscription (logout or permission revoked)
// @route   POST /api/notifications/unsubscribe
// @access  Private
const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400);
      throw new Error('Endpoint required');
    }

    const user = await User.findById(req.user._id);
    if (user) {
      user.pushSubscriptions = user.pushSubscriptions.filter(
        s => s.endpoint !== endpoint
      );
      await user.save();
    }

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== UTILITY: Send Push Notifications ====================

/**
 * Send push notification to a list of User IDs
 * @param {Array} userIds - Array of MongoDB User _ids
 * @param {Object} payload - { title, body, icon, url, tag }
 */
const sendPushToUsers = async (userIds, payload) => {
  try {
    const users = await User.find({
      _id: { $in: userIds },
      status: 'Active',
      'pushSubscriptions.0': { $exists: true } // at least one subscription
    }).select('pushSubscriptions');

    const notificationPayload = JSON.stringify({
      title: payload.title || 'Navoday',
      body: payload.body || '',
      icon: payload.icon || '/logo.png',
      badge: '/logo.png',
      url: payload.url || '/',
      tag: payload.tag || 'navoday-notification'
    });

    const sendPromises = [];

    for (const user of users) {
      for (const sub of user.pushSubscriptions) {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
        };

        sendPromises.push(
          webpush.sendNotification(pushSub, notificationPayload).catch(err => {
            // Subscription expired or invalid - remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
              User.updateOne(
                { _id: user._id },
                { $pull: { pushSubscriptions: { endpoint: sub.endpoint } } }
              ).exec();
            }
          })
        );
      }
    }

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error('Push notification error:', error.message);
  }
};

/**
 * Send push notification to ALL students (Global broadcast)
 * @param {Object} payload - { title, body, icon, url, tag }
 */
const sendPushToAllStudents = async (payload) => {
  try {
    const students = await User.find({
      role: 'Student',
      status: 'Active',
      'pushSubscriptions.0': { $exists: true }
    }).select('_id');

    const studentIds = students.map(s => s._id);
    await sendPushToUsers(studentIds, payload);
  } catch (error) {
    console.error('Broadcast push error:', error.message);
  }
};

/**
 * Send push notification to students of a specific village
 * @param {String} villageId
 * @param {Object} payload
 */
const sendPushToVillageStudents = async (villageId, payload) => {
  try {
    const profiles = await StudentProfile.find({ villageId }).select('userId');
    const userIds = profiles.map(p => p.userId);
    await sendPushToUsers(userIds, payload);
  } catch (error) {
    console.error('Village push error:', error.message);
  }
};

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  sendPushToUsers,
  sendPushToAllStudents,
  sendPushToVillageStudents
};
