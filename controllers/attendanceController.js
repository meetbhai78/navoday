const Attendance = require('../models/Attendance');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const User = require('../models/User');
const Village = require('../models/Village');
const Class = require('../models/Class');
const { logActivity } = require('../middleware/logger');

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

// @desc    Mark Daily Attendance
// @route   POST /api/attendance/mark
// @access  Private (Admin / Teacher)
const markAttendance = async (req, res, next) => {
  try {
    const { classId, villageId, date, records } = req.body; // records: [{ studentId, status: 'Present'|'Absent' }]

    if (!classId || !villageId || !date || !records || !Array.isArray(records)) {
      res.status(400);
      throw new Error('Please provide classId, villageId, date, and student records');
    }

    // Access check
    const hasAccess = await hasVillageAccess(req.user, villageId);
    if (!hasAccess) {
      res.status(403);
      throw new Error('You are not authorized to mark attendance for this village');
    }

    // Set date to midnight to make standard queries easy
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const savedRecords = [];
    for (const record of records) {
      const { studentId, status } = record;
      if (!['Present', 'Absent'].includes(status)) continue;

      // Ensure student belongs to class & village
      const studentProfile = await StudentProfile.findOne({ userId: studentId, classId, villageId });
      if (!studentProfile) continue;

      const recordDoc = await Attendance.findOneAndUpdate(
        { studentId, date: attendanceDate },
        {
          classId,
          villageId,
          status,
          markedBy: req.user._id
        },
        { upsert: true, new: true }
      );
      savedRecords.push(recordDoc);
    }

    await logActivity(req.user._id, 'MARK_ATTENDANCE', `Marked attendance for village ${villageId}, class ${classId} on date ${attendanceDate.toISOString().split('T')[0]}`, req);

    res.status(200).json({ message: 'Attendance marked successfully', count: savedRecords.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Students List with Today's Attendance status for marking
// @route   GET /api/attendance/list
// @access  Private (Admin / Teacher)
const getStudentsForAttendance = async (req, res, next) => {
  try {
    const { classId, villageId, date } = req.query;

    if (!classId || !villageId || !date) {
      res.status(400);
      throw new Error('Please provide classId, villageId, and date');
    }

    const hasAccess = await hasVillageAccess(req.user, villageId);
    if (!hasAccess) {
      res.status(403);
      throw new Error('You are not authorized to access students of this village');
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Get all students in this village + class
    const studentProfiles = await StudentProfile.find({ classId, villageId })
      .populate('userId', 'name username status');

    // Get attendance records for this date
    const attendanceRecords = await Attendance.find({
      classId,
      villageId,
      date: attendanceDate
    });

    const attendanceMap = {};
    attendanceRecords.forEach(rec => {
      attendanceMap[rec.studentId.toString()] = rec.status;
    });

    const studentsList = studentProfiles
      .filter(sp => sp.userId && sp.userId.status === 'Active')
      .map(sp => ({
        studentId: sp.userId._id,
        name: sp.userId.name,
        username: sp.userId.username,
        rollNumber: sp.rollNumber,
        status: attendanceMap[sp.userId._id.toString()] || '' // '' means not marked yet
      }));

    res.json(studentsList);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Attendance History for a single Student (Calendar view)
// @route   GET /api/attendance/student/:studentId
// @access  Private (Admin / Teacher / Student himself)
const getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;

    // Protection: Students can only view their own history
    if (req.user.role === 'Student' && req.user._id.toString() !== studentId) {
      res.status(403);
      throw new Error('Not authorized to view other student attendance history');
    }

    const records = await Attendance.find({ studentId })
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    next(error);
  }
};

// @desc    Get village-wise and class-wise Monthly Summary Reports
// @route   GET /api/attendance/report
// @access  Private (Admin / Teacher)
const getAttendanceReport = async (req, res, next) => {
  try {
    const { villageId, classId, month, year } = req.query; // month: 0-11, year: YYYY

    if (!month || !year) {
      res.status(400);
      throw new Error('Month and Year are required parameters');
    }

    const filter = {};
    if (villageId) {
      const hasAccess = await hasVillageAccess(req.user, villageId);
      if (!hasAccess) {
        res.status(403);
        throw new Error('Unauthorized to view reports for this village');
      }
      filter.villageId = new mongoose.Types.ObjectId(villageId);
    } else if (req.user.role === 'Teacher') {
      // If teacher is running global query, filter by their villages
      const profile = await TeacherProfile.findOne({ userId: req.user._id });
      if (!profile || profile.villageIds.length === 0) {
        return res.json([]);
      }
      filter.villageId = { $in: profile.villageIds };
    }

    if (classId) {
      filter.classId = new mongoose.Types.ObjectId(classId);
    }

    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, parseInt(month) + 1, 1));

    filter.date = { $gte: startDate, $lt: endDate };

    // Aggregate stats per student
    const studentStats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$studentId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: '$profile' },
      {
        $lookup: {
          from: 'villages',
          localField: 'profile.villageId',
          foreignField: '_id',
          as: 'village'
        }
      },
      { $unwind: '$village' },
      {
        $project: {
          studentName: '$student.name',
          villageName: '$village.name',
          rollNumber: '$profile.rollNumber',
          totalDays: 1,
          presentDays: 1,
          percentage: {
            $round: [
              { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] },
              1
            ]
          }
        }
      },
      { $sort: { percentage: -1 } }
    ]);

    res.json(studentStats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getStudentsForAttendance,
  getStudentAttendanceHistory,
  getAttendanceReport
};
