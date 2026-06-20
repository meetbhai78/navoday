const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const Village = require('../models/Village');
const Class = require('../models/Class');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../middleware/logger');

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyfornavodayapp123!', {
    expiresIn: '30d',
  });
};

// @desc    Register a new student
// @route   POST /api/auth/register-student
// @access  Public
const registerStudent = async (req, res, next) => {
  try {
    const { password, name, email, phone, rollNumber, classId, villageId } = req.body;

    // Use the phone number as the username to ensure uniqueness per student
    const username = phone;

    const userExists = await User.findOne({ username });
    if (userExists) {
      res.status(400);
      throw new Error('This mobile number is already registered.');
    }

    // Validate Class and Village
    const classExists = await Class.findById(classId);
    const villageExists = await Village.findById(villageId);
    if (!classExists || !villageExists) {
      res.status(400);
      throw new Error('Invalid Class or Village selection');
    }

    // Create User
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

    // Create Student Profile without guardian details
    const studentProfile = await StudentProfile.create({
      userId: user._id,
      rollNumber,
      classId,
      villageId
    });

    await logActivity(user._id, 'REGISTER', `Student registered successfully: ${username}`, req);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
      languagePreference: user.languagePreference,
      token: generateToken(user._id),
      profile: studentProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // The 'username' field from frontend will now contain the Mobile Number (or an actual username for admins).
    // We search the DB for either a matching username OR a matching phone number.
    const user = await User.findOne({ 
      $or: [{ username: username }, { phone: username }] 
    });
    
    if (user && (await user.matchPassword(password))) {
      if (user.status === 'Inactive') {
        res.status(403);
        throw new Error('Account is deactivated. Contact Admin.');
      }

      let profile = null;
      if (user.role === 'Student') {
        profile = await StudentProfile.findOne({ userId: user._id })
          .populate('classId', 'name code')
          .populate('villageId', 'name code');
      } else if (user.role === 'Teacher') {
        profile = await TeacherProfile.findOne({ userId: user._id })
          .populate('villageIds', 'name code');
      }

      await logActivity(user._id, 'LOGIN', `User logged in: ${username}`, req);

      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        languagePreference: user.languagePreference,
        token: generateToken(user._id),
        profile
      });
    } else {
      res.status(401);
      throw new Error('Invalid username or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let profile = null;
      if (user.role === 'Student') {
        profile = await StudentProfile.findOne({ userId: user._id })
          .populate('classId', 'name code')
          .populate('villageId', 'name code');
      } else if (user.role === 'Teacher') {
        profile = await TeacherProfile.findOne({ userId: user._id })
          .populate('villageIds', 'name code');
      }

      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        languagePreference: user.languagePreference,
        profile
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Change Language Preference
// @route   PUT /api/auth/language
// @access  Private
const changeLanguage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { language } = req.body;
    if (!['en', 'gu'].includes(language)) {
      res.status(400);
      throw new Error('Invalid language code. Choose "en" or "gu"');
    }

    user.languagePreference = language;
    await user.save();

    await logActivity(user._id, 'CHANGE_LANGUAGE', `Changed language to: ${language}`, req);

    res.json({ message: 'Language updated successfully', language: user.languagePreference });
  } catch (error) {
    next(error);
  }
};

// @desc    Change Password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { currentPassword, newPassword } = req.body;
    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error('Incorrect current password');
    }

    user.password = newPassword;
    await user.save();

    await logActivity(user._id, 'CHANGE_PASSWORD', `Changed user password`, req);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all villages (public registration helper)
// @route   GET /api/auth/villages
// @access  Public
const getPublicVillages = async (req, res, next) => {
  try {
    const villages = await Village.find();
    res.json(villages);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all classes (public registration helper)
// @route   GET /api/auth/classes
// @access  Public
const getPublicClasses = async (req, res, next) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students (helper for teachers/messaging)
// @route   GET /api/auth/students
// @access  Private
const getPublicStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'Student' }).select('name username _id');
    res.json(students);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerStudent,
  loginUser,
  getUserProfile,
  changeLanguage,
  changePassword,
  getPublicVillages,
  getPublicClasses,
  getPublicStudents
};
