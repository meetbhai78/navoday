const Homework = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const StudyMaterial = require('../models/StudyMaterial');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const { logActivity } = require('../middleware/logger');
const { uploadToCloudinary } = require('../utils/cloudinary');
const path = require('path');
const fs = require('fs');

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

// ==================== HOMEWORK ====================

// @desc    Upload / Create Homework
// @route   POST /api/homework
// @access  Private (Admin / Teacher)
const createHomework = async (req, res, next) => {
  try {
    const { title, description, subject, classId, villageId, dueDate } = req.body;

    if (!title || !subject || !classId || !villageId || !dueDate) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    const access = await hasVillageAccess(req.user, villageId);
    if (!access) {
      res.status(403);
      throw new Error('Unauthorized to post homework to this village');
    }

    let fileUrl = '';
    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path);
      if (cloudUrl) {
        fileUrl = cloudUrl;
        fs.unlinkSync(req.file.path);
      } else {
        fileUrl = `/uploads/${req.file.filename}`;
      }
    }

    const homework = await Homework.create({
      title,
      description,
      subject,
      classId,
      villageId,
      dueDate,
      fileUrl,
      createdBy: req.user._id
    });

    await logActivity(req.user._id, 'CREATE_HOMEWORK', `Uploaded homework: ${title}`, req);

    res.status(201).json(homework);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Homework list
// @route   GET /api/homework
// @access  Private
const getHomework = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'Student') {
      const profile = await StudentProfile.findOne({ userId: req.user._id });
      if (!profile) return res.json([]);
      query.classId = profile.classId;
      query.villageId = profile.villageId;
    } else if (req.user.role === 'Teacher') {
      const profile = await TeacherProfile.findOne({ userId: req.user._id });
      if (!profile) return res.json([]);
      query.$or = [
        { createdBy: req.user._id },
        { villageId: { $in: profile.villageIds } }
      ];
    }

    const homework = await Homework.find(query)
      .populate('classId', 'name code')
      .populate('villageId', 'name code')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });

    // For students, enrich with submission status
    if (req.user.role === 'Student') {
      const enrichedHomework = [];
      for (let hw of homework) {
        const submission = await HomeworkSubmission.findOne({ homeworkId: hw._id, studentId: req.user._id });
        enrichedHomework.push({
          ...hw.toObject(),
          submissionStatus: submission ? submission.status : 'Pending',
          submissionFileUrl: submission ? submission.fileUrl : '',
          submissionRemarks: submission ? submission.remarks : '',
          submittedAt: submission ? submission.submittedAt : null
        });
      }
      return res.json(enrichedHomework);
    }

    res.json(homework);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Homework
// @route   DELETE /api/homework/:id
// @access  Private (Admin / Teacher)
const deleteHomework = async (req, res, next) => {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      res.status(404);
      throw new Error('Homework not found');
    }

    const access = await hasVillageAccess(req.user, homework.villageId);
    if (!access) {
      res.status(403);
      throw new Error('Unauthorized to delete this homework');
    }

    // Delete file locally if exists
    if (homework.fileUrl) {
      const filePath = path.join(__dirname, '..', homework.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete all submissions
    const submissions = await HomeworkSubmission.find({ homeworkId: homework._id });
    for (let sub of submissions) {
      if (sub.fileUrl) {
        const subPath = path.join(__dirname, '..', sub.fileUrl);
        if (fs.existsSync(subPath)) {
          fs.unlinkSync(subPath);
        }
      }
    }
    await HomeworkSubmission.deleteMany({ homeworkId: homework._id });

    await homework.deleteOne();
    await logActivity(req.user._id, 'DELETE_HOMEWORK', `Deleted homework: ${homework.title}`, req);

    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit homework
// @route   POST /api/homework/:id/submit
// @access  Private (Student)
const submitHomework = async (req, res, next) => {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      res.status(404);
      throw new Error('Homework not found');
    }

    // Check if due date is passed (optional, we can allow late submission and mark it late)
    let fileUrl = '';
    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path);
      if (cloudUrl) {
        fileUrl = cloudUrl;
        fs.unlinkSync(req.file.path);
      } else {
        fileUrl = `/uploads/${req.file.filename}`;
      }
    } else {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const submission = await HomeworkSubmission.findOneAndUpdate(
      { homeworkId: homework._id, studentId: req.user._id },
      {
        fileUrl,
        submittedAt: Date.now(),
        status: 'Submitted'
      },
      { upsert: true, new: true }
    );

    await logActivity(req.user._id, 'SUBMIT_HOMEWORK', `Submitted homework for: ${homework.title}`, req);

    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Homework submissions
// @route   GET /api/homework/:id/submissions
// @access  Private (Admin / Teacher)
const getSubmissions = async (req, res, next) => {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      res.status(404);
      throw new Error('Homework not found');
    }

    const access = await hasVillageAccess(req.user, homework.villageId);
    if (!access) {
      res.status(403);
      throw new Error('Unauthorized');
    }

    const submissions = await HomeworkSubmission.find({ homeworkId: homework._id })
      .populate('studentId', 'name username');

    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

// @desc    Grade / Give remarks on homework submission
// @route   PUT /api/homework/submission/:subId/grade
// @access  Private (Admin / Teacher)
const gradeSubmission = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const submission = await HomeworkSubmission.findById(req.params.subId)
      .populate({
        path: 'homeworkId',
        select: 'villageId title'
      });

    if (!submission) {
      res.status(404);
      throw new Error('Submission not found');
    }

    const access = await hasVillageAccess(req.user, submission.homeworkId.villageId);
    if (!access) {
      res.status(403);
      throw new Error('Unauthorized to grade this homework');
    }

    submission.status = status || submission.status;
    submission.remarks = remarks || submission.remarks;
    await submission.save();

    await logActivity(req.user._id, 'GRADE_HOMEWORK', `Graded homework submission of: ${submission.homeworkId.title}`, req);

    res.json(submission);
  } catch (error) {
    next(error);
  }
};

// ==================== STUDY MATERIAL ====================

// @desc    Upload Study Material
// @route   POST /api/homework/materials
// @access  Private (Admin / Teacher)
const createStudyMaterial = async (req, res, next) => {
  try {
    const { title, description, subject, classId } = req.body;

    if (!title || !subject || !classId) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    let fileUrl = '';
    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path);
      if (cloudUrl) {
        fileUrl = cloudUrl;
        fs.unlinkSync(req.file.path);
      } else {
        fileUrl = `/uploads/${req.file.filename}`;
      }
    } else {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const material = await StudyMaterial.create({
      title,
      description,
      subject,
      classId,
      fileUrl,
      uploadedBy: req.user._id
    });

    await logActivity(req.user._id, 'CREATE_MATERIAL', `Uploaded study material: ${title}`, req);

    res.status(201).json(material);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Study Materials
// @route   GET /api/homework/materials
// @access  Private
const getStudyMaterials = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'Student') {
      const profile = await StudentProfile.findOne({ userId: req.user._id });
      if (!profile) return res.json([]);
      query.classId = profile.classId;
    }

    const materials = await StudyMaterial.find(query)
      .populate('classId', 'name code')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Study Material
// @route   DELETE /api/homework/materials/:id
// @access  Private (Admin / Teacher)
const deleteStudyMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      res.status(404);
      throw new Error('Study material not found');
    }

    // Delete file locally
    if (material.fileUrl) {
      const filePath = path.join(__dirname, '..', material.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await material.deleteOne();
    await logActivity(req.user._id, 'DELETE_MATERIAL', `Deleted study material: ${material.title}`, req);

    res.json({ message: 'Study material deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHomework,
  getHomework,
  deleteHomework,
  submitHomework,
  getSubmissions,
  gradeSubmission,
  createStudyMaterial,
  getStudyMaterials,
  deleteStudyMaterial
};
