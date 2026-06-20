const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Message = require('../models/Message');
const Announcement = require('../models/Announcement');
const Homework = require('../models/Homework');

// @desc    Get Teacher Dashboard analytics
// @route   GET /api/dashboard/teacher
// @access  Private (Teacher)
const getTeacherDashboard = async (req, res, next) => {
  try {
    const profile = await TeacherProfile.findOne({ userId: req.user._id });
    if (!profile) {
      res.status(404);
      throw new Error('Teacher profile not found');
    }

    const assignedVillages = profile.villageIds;

    // Total Students under teacher's assigned villages
    const totalStudents = await StudentProfile.countDocuments({
      villageId: { $in: assignedVillages }
    });

    // Today's attendance snapshot
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({
      villageId: { $in: assignedVillages },
      date: today
    });

    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;

    // Upcoming exams
    const upcomingExams = await Exam.find({
      $or: [
        { villageId: { $in: assignedVillages } },
        { villageId: null }
      ],
      date: { $gte: today }
    })
      .populate('classId', 'name')
      .populate('villageId', 'name')
      .sort({ date: 1 })
      .limit(5);

    // Recent activity (homework created, messages sent)
    const recentHomework = await Homework.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3);

    const recentMessages = await Message.find({ senderId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({
      metrics: {
        totalStudents,
        attendanceSnapshot: {
          present: presentCount,
          absent: absentCount,
          totalMarked: attendanceRecords.length
        }
      },
      upcomingExams,
      recentActivity: {
        homework: recentHomework,
        messages: recentMessages
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student Dashboard analytics
// @route   GET /api/dashboard/student
// @access  Private (Student)
const getStudentDashboard = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      res.status(404);
      throw new Error('Student profile not found');
    }

    // Attendance rate
    const totalAttendance = await Attendance.countDocuments({ studentId: req.user._id });
    const presentAttendance = await Attendance.countDocuments({ studentId: req.user._id, status: 'Present' });
    const attendancePercentage = totalAttendance > 0
      ? Math.round((presentAttendance / totalAttendance) * 100)
      : 100; // default to 100% or 0%? Let's say 100% or N/A

    // Latest marks (published results)
    const latestResults = await Result.find({ studentId: req.user._id, published: true })
      .populate({
        path: 'examId',
        select: 'title totalMarks passingMarks date'
      })
      .sort({ submittedAt: -1 })
      .limit(3);

    // Upcoming exams
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const upcomingExams = await Exam.find({
      classId: profile.classId,
      $or: [
        { villageId: profile.villageId },
        { villageId: null }
      ],
      date: { $gte: today }
    })
      .sort({ date: 1 })
      .limit(3);

    // Unread messages count
    const unreadMessagesCount = await Message.countDocuments({
      $or: [
        { scope: 'Global' },
        { scope: 'Village', villageId: profile.villageId },
        { scope: 'Individual', receiverId: req.user._id }
      ],
      readBy: { $ne: req.user._id }
    });

    // Recent announcements
    const recentAnnouncements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({
      metrics: {
        attendancePercentage,
        unreadMessagesCount
      },
      latestResults,
      upcomingExams,
      recentAnnouncements
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeacherDashboard,
  getStudentDashboard
};
