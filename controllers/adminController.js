const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const Village = require('../models/Village');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const { logActivity } = require('../middleware/logger');
const mongoose = require('mongoose');

// ==================== DASHBOARD & ANALYTICS ====================

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardData = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalTeachers = await User.countDocuments({ role: 'Teacher' });
    const totalVillages = await Village.countDocuments();
    const totalClasses = await Class.countDocuments();

    // Village-wise student distribution
    const villageDistribution = await StudentProfile.aggregate([
      {
        $group: {
          _id: '$villageId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'villages',
          localField: '_id',
          foreignField: '_id',
          as: 'village'
        }
      },
      {
        $unwind: '$village'
      },
      {
        $project: {
          name: '$village.name',
          code: '$village.code',
          count: 1
        }
      }
    ]);

    // Overall Attendance Rate
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          }
        }
      }
    ]);
    const overallAttendanceRate = attendanceStats.length > 0
      ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100)
      : 0;

    // Student performance rankings (Top and Weak students based on average Result marks)
    const studentPerformance = await Result.aggregate([
      {
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' },
      {
        $group: {
          _id: '$studentId',
          avgPercentage: {
            $avg: {
              $multiply: [
                { $divide: ['$marksObtained', '$exam.totalMarks'] },
                100
              ]
            }
          },
          examsCount: { $sum: 1 }
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
          name: '$student.name',
          username: '$student.username',
          villageName: '$village.name',
          avgPercentage: { $round: ['$avgPercentage', 1] },
          examsCount: 1
        }
      }
    ]);

    const topStudents = [...studentPerformance]
      .sort((a, b) => b.avgPercentage - a.avgPercentage)
      .slice(0, 5);

    const weakStudents = [...studentPerformance]
      .sort((a, b) => a.avgPercentage - b.avgPercentage)
      .slice(0, 5);

    // Recent Activity Logs (top 10)
    const recentLogs = await AuditLog.find()
      .populate('userId', 'name role')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      metrics: {
        totalStudents,
        totalTeachers,
        totalVillages,
        totalClasses,
        overallAttendanceRate
      },
      villageDistribution,
      topStudents,
      weakStudents,
      recentLogs
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VILLAGE CRUD ====================

const getVillages = async (req, res, next) => {
  try {
    const villages = await Village.find();
    res.json(villages);
  } catch (error) {
    next(error);
  }
};

const createVillage = async (req, res, next) => {
  try {
    const { name, code, district, state } = req.body;
    const villageExists = await Village.findOne({ $or: [{ name }, { code }] });
    if (villageExists) {
      res.status(400);
      throw new Error('Village name or code already exists');
    }
    const village = await Village.create({ name, code, district, state });
    await logActivity(req.user._id, 'CREATE_VILLAGE', `Created village: ${name}`, req);
    res.status(201).json(village);
  } catch (error) {
    next(error);
  }
};

const updateVillage = async (req, res, next) => {
  try {
    const { name, code, district, state } = req.body;
    const village = await Village.findById(req.params.id);
    if (!village) {
      res.status(404);
      throw new Error('Village not found');
    }
    village.name = name || village.name;
    village.code = code || village.code;
    village.district = district || village.district;
    village.state = state || village.state;
    await village.save();
    await logActivity(req.user._id, 'UPDATE_VILLAGE', `Updated village: ${village.name}`, req);
    res.json(village);
  } catch (error) {
    next(error);
  }
};

const deleteVillage = async (req, res, next) => {
  try {
    const village = await Village.findById(req.params.id);
    if (!village) {
      res.status(404);
      throw new Error('Village not found');
    }
    // Check if there are profiles linked
    const studentCount = await StudentProfile.countDocuments({ villageId: village._id });
    const teacherCount = await TeacherProfile.countDocuments({ villageIds: village._id });
    if (studentCount > 0 || teacherCount > 0) {
      res.status(400);
      throw new Error('Cannot delete village because it has assigned teachers or students');
    }
    await village.deleteOne();
    await logActivity(req.user._id, 'DELETE_VILLAGE', `Deleted village: ${village.name}`, req);
    res.json({ message: 'Village deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== CLASS CRUD ====================

const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const classExists = await Class.findOne({ $or: [{ name }, { code }] });
    if (classExists) {
      res.status(400);
      throw new Error('Class/Standard name or code already exists');
    }
    const standard = await Class.create({ name, code });
    await logActivity(req.user._id, 'CREATE_CLASS', `Created class: ${name}`, req);
    res.status(201).json(standard);
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const standard = await Class.findById(req.params.id);
    if (!standard) {
      res.status(404);
      throw new Error('Class/Standard not found');
    }
    standard.name = name || standard.name;
    standard.code = code || standard.code;
    await standard.save();
    await logActivity(req.user._id, 'UPDATE_CLASS', `Updated class: ${standard.name}`, req);
    res.json(standard);
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const standard = await Class.findById(req.params.id);
    if (!standard) {
      res.status(404);
      throw new Error('Class/Standard not found');
    }
    const studentsUsing = await StudentProfile.countDocuments({ classId: standard._id });
    if (studentsUsing > 0) {
      res.status(400);
      throw new Error('Cannot delete class because students are enrolled in it');
    }
    await standard.deleteOne();
    await logActivity(req.user._id, 'DELETE_CLASS', `Deleted class: ${standard.name}`, req);
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== TEACHER CRUD ====================

const getTeachers = async (req, res, next) => {
  try {
    const teachers = await User.find({ role: 'Teacher' }).select('-password');
    const teacherDetails = [];
    for (let teacher of teachers) {
      const profile = await TeacherProfile.findOne({ userId: teacher._id }).populate('villageIds', 'name code');
      teacherDetails.push({
        user: teacher,
        profile
      });
    }
    res.json(teacherDetails);
  } catch (error) {
    next(error);
  }
};

const createTeacher = async (req, res, next) => {
  try {
    const { username, password, name, email, phone, villageIds, specialization } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      res.status(400);
      throw new Error('Username already exists');
    }

    const user = await User.create({
      username,
      password,
      role: 'Teacher',
      name,
      email,
      phone,
      languagePreference: 'gu',
      status: 'Active'
    });

    const profile = await TeacherProfile.create({
      userId: user._id,
      villageIds: villageIds || [],
      specialization: specialization || ''
    });

    await logActivity(req.user._id, 'CREATE_TEACHER', `Created Teacher user: ${username}`, req);

    res.status(201).json({
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        status: user.status
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const { name, email, phone, status, villageIds, specialization, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'Teacher') {
      res.status(404);
      throw new Error('Teacher not found');
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.status = status || user.status;
    if (password) {
      user.password = password; // pre-save will hash
    }
    await user.save();

    let profile = await TeacherProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new TeacherProfile({ userId: user._id });
    }
    profile.villageIds = villageIds !== undefined ? villageIds : profile.villageIds;
    profile.specialization = specialization !== undefined ? specialization : profile.specialization;
    await profile.save();

    await logActivity(req.user._id, 'UPDATE_TEACHER', `Updated Teacher user: ${user.username}`, req);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        status: user.status
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'Teacher') {
      res.status(404);
      throw new Error('Teacher not found');
    }
    await TeacherProfile.deleteOne({ userId: user._id });
    await user.deleteOne();
    await logActivity(req.user._id, 'DELETE_TEACHER', `Deleted Teacher user: ${user.username}`, req);
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== STUDENT CRUD ====================

const getStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'Student' }).select('-password');
    const studentDetails = [];
    for (let student of students) {
      const profile = await StudentProfile.findOne({ userId: student._id })
        .populate('classId', 'name code')
        .populate('villageId', 'name code');
      studentDetails.push({
        user: student,
        profile
      });
    }
    res.json(studentDetails);
  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const { username, password, name, email, phone, rollNumber, classId, villageId, guardianName, guardianPhone } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      res.status(400);
      throw new Error('Username already exists');
    }

    const classExists = await Class.findById(classId);
    const villageExists = await Village.findById(villageId);
    if (!classExists || !villageExists) {
      res.status(400);
      throw new Error('Invalid Class or Village');
    }

    const user = await User.create({
      username,
      password,
      role: 'Student',
      name,
      email,
      phone,
      languagePreference: 'gu',
      status: 'Active'
    });

    const profile = await StudentProfile.create({
      userId: user._id,
      rollNumber: rollNumber || '',
      classId,
      villageId,
      guardianName: guardianName || '',
      guardianPhone: guardianPhone || ''
    });

    await logActivity(req.user._id, 'CREATE_STUDENT', `Created Student user: ${username}`, req);

    res.status(201).json({
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        status: user.status
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { name, email, phone, status, rollNumber, classId, villageId, guardianName, guardianPhone, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'Student') {
      res.status(404);
      throw new Error('Student not found');
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.status = status || user.status;
    if (password) {
      user.password = password;
    }
    await user.save();

    let profile = await StudentProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new StudentProfile({ userId: user._id, classId, villageId });
    }

    if (classId) {
      const classExists = await Class.findById(classId);
      if (!classExists) {
        res.status(400);
        throw new Error('Invalid Class selected');
      }
      profile.classId = classId;
    }

    if (villageId) {
      const villageExists = await Village.findById(villageId);
      if (!villageExists) {
        res.status(400);
        throw new Error('Invalid Village selected');
      }
      profile.villageId = villageId;
    }

    profile.rollNumber = rollNumber !== undefined ? rollNumber : profile.rollNumber;
    profile.guardianName = guardianName !== undefined ? guardianName : profile.guardianName;
    profile.guardianPhone = guardianPhone !== undefined ? guardianPhone : profile.guardianPhone;
    await profile.save();

    await logActivity(req.user._id, 'UPDATE_STUDENT', `Updated Student user: ${user.username}`, req);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        status: user.status
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'Student') {
      res.status(404);
      throw new Error('Student not found');
    }
    await StudentProfile.deleteOne({ userId: user._id });
    await user.deleteOne();
    await logActivity(req.user._id, 'DELETE_STUDENT', `Deleted Student user: ${user.username}`, req);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== AUDIT LOGS ====================

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name username role')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
