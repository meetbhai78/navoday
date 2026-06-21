const Message = require('../models/Message');
const Announcement = require('../models/Announcement');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const User = require('../models/User');
const { logActivity } = require('../middleware/logger');
const { sendPushToUsers, sendPushToAllStudents, sendPushToVillageStudents } = require('./notificationController');

// Access validation helper
const hasVillageAccess = async (user, villageId) => {
  if (user.role === 'Admin') return true;
  if (user.role === 'Teacher') {
    const profile = await TeacherProfile.findOne({ userId: user._id });
    if (!profile) return false;
    return profile.villageIds.map(id => id.toString()).includes(villageId.toString());
  }
  return false;
};

// @desc    Send Message
// @route   POST /api/messages
// @access  Private (Admin / Teacher)
const sendMessage = async (req, res, next) => {
  try {
    const { scope, receiverId, villageId, content } = req.body;

    if (!scope || !content) {
      res.status(400);
      throw new Error('Scope and content are required');
    }

    if (scope === 'Individual' && !receiverId) {
      res.status(400);
      throw new Error('Receiver is required for Individual message');
    }

    if (scope === 'Village' && !villageId) {
      res.status(400);
      throw new Error('Village is required for Village message');
    }

    // Permission validations
    if (scope === 'Village') {
      const access = await hasVillageAccess(req.user, villageId);
      if (!access) {
        res.status(403);
        throw new Error('Unauthorized to message this village');
      }
    }

    if (scope === 'Individual') {
      const studentProfile = await StudentProfile.findOne({ userId: receiverId });
      if (studentProfile) {
        const access = await hasVillageAccess(req.user, studentProfile.villageId);
        if (!access) {
          res.status(403);
          throw new Error('Unauthorized to message this student (not in your assigned villages)');
        }
      }
    }

    const message = await Message.create({
      senderId: req.user._id,
      scope,
      receiverId: receiverId || null,
      villageId: villageId || null,
      content
    });

    await logActivity(req.user._id, 'SEND_MESSAGE', `Sent ${scope} message`, req);

    // ===== PUSH NOTIFICATIONS =====
    const senderName = req.user.name || 'Navoday';
    const shortContent = content.length > 80 ? content.substring(0, 80) + '...' : content;
    const notifPayload = {
      title: `📩 ${senderName} નો Message`,
      body: shortContent,
      url: '/?tab=messages',
      tag: 'new-message'
    };

    if (scope === 'Global') {
      // Send to all students asynchronously (don't wait)
      sendPushToAllStudents(notifPayload).catch(console.error);
    } else if (scope === 'Village' && villageId) {
      sendPushToVillageStudents(villageId, notifPayload).catch(console.error);
    } else if (scope === 'Individual' && receiverId) {
      sendPushToUsers([receiverId], notifPayload).catch(console.error);
    }
    // ===== END PUSH NOTIFICATIONS =====

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Inbox Messages
// @route   GET /api/messages
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    if (req.user.role === 'Student') {
      const profile = await StudentProfile.findOne({ userId: req.user._id });
      if (!profile) return res.json([]);

      // Fetch individual messages to student, messages to their village, and global messages
      const messages = await Message.find({
        $or: [
          { scope: 'Global' },
          { scope: 'Village', villageId: profile.villageId },
          { scope: 'Individual', receiverId: req.user._id }
        ]
      })
        .populate('senderId', 'name role')
        .sort({ createdAt: -1 });

      // Append unread status to response dynamically
      const formattedMessages = messages.map(msg => {
        const isRead = msg.readBy.map(id => id.toString()).includes(req.user._id.toString());
        return {
          ...msg.toObject(),
          isRead
        };
      });

      return res.json(formattedMessages);
    }

    // For Admin / Teacher, display sent messages
    const query = { senderId: req.user._id };
    const sentMessages = await Message.find(query)
      .populate('receiverId', 'name')
      .populate('villageId', 'name')
      .sort({ createdAt: -1 });

    res.json(sentMessages);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Message as read
// @route   PUT /api/messages/:id/read
// @access  Private (Student)
const markMessageAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    if (!message.readBy.map(id => id.toString()).includes(req.user._id.toString())) {
      message.readBy.push(req.user._id);
      await message.save();
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};

// ==================== ANNOUNCEMENTS ====================

// @desc    Create Announcement
// @route   POST /api/messages/announcements
// @access  Private (Admin)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400);
      throw new Error('Title and content are required');
    }

    const announcement = await Announcement.create({
      title,
      content,
      createdBy: req.user._id
    });

    await logActivity(req.user._id, 'CREATE_ANNOUNCEMENT', `Created announcement: ${title}`, req);

    // ===== PUSH NOTIFICATIONS - Broadcast to all students =====
    sendPushToAllStudents({
      title: `📢 નવી Announcement: ${title}`,
      body: content.length > 80 ? content.substring(0, 80) + '...' : content,
      url: '/?tab=dashboard',
      tag: 'announcement'
    }).catch(console.error);
    // ===== END PUSH NOTIFICATIONS =====

    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Announcements
// @route   GET /api/messages/announcements
// @access  Private
const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Announcement
// @route   DELETE /api/messages/announcements/:id
// @access  Private (Admin)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      res.status(404);
      throw new Error('Announcement not found');
    }

    await announcement.deleteOne();
    await logActivity(req.user._id, 'DELETE_ANNOUNCEMENT', `Deleted announcement: ${announcement.title}`, req);

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markMessageAsRead,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
};
