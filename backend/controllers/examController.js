const Exam = require('../models/Exam');
const Result = require('../models/Result');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const User = require('../models/User');
const { logActivity } = require('../middleware/logger');

// Access validation helper
const hasVillageAccess = async (user, villageId) => {
  if (!villageId) return true; // Global exams
  if (user.role === 'Admin') return true;
  if (user.role === 'Teacher') {
    const profile = await TeacherProfile.findOne({ userId: user._id });
    if (!profile) return false;
    return profile.villageIds.map(id => id.toString()).includes(villageId.toString());
  }
  return false;
};

// @desc    Create a new Exam/Test
// @route   POST /api/exams
// @access  Private (Admin / Teacher)
const createExam = async (req, res, next) => {
  try {
    const { title, type, classId, villageId, date, time, durationMinutes, totalMarks, passingMarks, questions } = req.body;

    if (!title || !type || !classId || !date || !totalMarks || !passingMarks) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    if (villageId) {
      const access = await hasVillageAccess(req.user, villageId);
      if (!access) {
        res.status(403);
        throw new Error('Unauthorized to schedule exam for this village');
      }
    }

    const exam = await Exam.create({
      title,
      type,
      classId,
      villageId: villageId || null,
      date,
      time,
      durationMinutes: durationMinutes || 0,
      totalMarks,
      passingMarks,
      questions: questions || [],
      createdBy: req.user._id
    });

    await logActivity(req.user._id, 'CREATE_EXAM', `Scheduled ${type} exam: ${title}`, req);

    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Exams list (filtered by role)
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'Student') {
      // Find Student Profile to filter by Class and Village
      const profile = await StudentProfile.findOne({ userId: req.user._id });
      if (!profile) {
        return res.json([]);
      }
      query.classId = profile.classId;
      query.$or = [
        { villageId: profile.villageId },
        { villageId: null } // Global class exams
      ];
    } else if (req.user.role === 'Teacher') {
      const profile = await TeacherProfile.findOne({ userId: req.user._id });
      if (!profile) {
        return res.json([]);
      }
      // Show exams created by this teacher or linked to their assigned villages
      query.$or = [
        { createdBy: req.user._id },
        { villageId: { $in: profile.villageIds } }
      ];
    }

    const exams = await Exam.find(query)
      .populate('classId', 'name code')
      .populate('villageId', 'name code')
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json(exams);
  } catch (error) {
    next(error);
  }
};

// @desc    Get details of a single exam (including questions for students during test)
// @route   GET /api/exams/:id
// @access  Private
const getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('classId', 'name code')
      .populate('villageId', 'name code');

    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    // Safety check for student: don't release questions before the exam date
    if (req.user.role === 'Student') {
      const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
      if (!studentProfile) {
        res.status(403);
        throw new Error('Student profile not found');
      }

      // Check if student has access to this exam
      const belongs = exam.classId._id.toString() === studentProfile.classId.toString() &&
        (!exam.villageId || exam.villageId._id.toString() === studentProfile.villageId.toString());

      if (!belongs) {
        res.status(403);
        throw new Error('Not authorized to access this exam');
      }

      // Check if already taken
      const alreadyTaken = await Result.findOne({ examId: exam._id, studentId: req.user._id });
      if (alreadyTaken) {
        // Return without question solutions
        const sanitizedExam = exam.toObject();
        sanitizedExam.questions = sanitizedExam.questions.map(q => {
          delete q.correctOptionIndex;
          return q;
        });
        return res.json({ exam: sanitizedExam, taken: true, result: alreadyTaken });
      }

      // Hide correct option indexes for online exam taker
      if (exam.type === 'Online') {
        const sanitizedExam = exam.toObject();
        sanitizedExam.questions = sanitizedExam.questions.map(q => {
          delete q.correctOptionIndex;
          return q;
        });
        return res.json({ exam: sanitizedExam, taken: false });
      }
    }

    res.json(exam);
  } catch (error) {
    next(error);
  }
};

// @desc    Submit answers for an Online MCQ Exam
// @route   POST /api/exams/:id/submit
// @access  Private (Student)
const submitOnlineExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || exam.type !== 'Online') {
      res.status(400);
      throw new Error('Invalid exam submission');
    }

    // Check if already submitted
    const existingResult = await Result.findOne({ examId: exam._id, studentId: req.user._id });
    if (existingResult) {
      res.status(400);
      throw new Error('You have already taken this exam');
    }

    const { submissions } = req.body; // Array of { questionId, selectedOptionIndex, answerText }
    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.questionId] = sub;
    });

    let marksObtained = 0;
    const answers = [];

    // Auto grade MCQ questions
    exam.questions.forEach(q => {
      const sub = submissionMap[q._id.toString()];
      let marksAwarded = 0;
      let selectedOptionIndex = null;
      let answerText = '';

      if (sub) {
        selectedOptionIndex = sub.selectedOptionIndex;
        answerText = sub.answerText || '';

        if (q.type === 'MCQ') {
          if (selectedOptionIndex === q.correctOptionIndex) {
            marksAwarded = q.marks;
          }
        }
      }

      marksObtained += marksAwarded;
      answers.push({
        questionId: q._id,
        selectedOptionIndex,
        answerText,
        marksAwarded
      });
    });

    const isPassed = marksObtained >= exam.passingMarks;

    const result = await Result.create({
      examId: exam._id,
      studentId: req.user._id,
      marksObtained,
      isPassed,
      answers,
      published: true // Online exam auto-publishes immediately
    });

    await logActivity(req.user._id, 'SUBMIT_EXAM', `Took online test ${exam.title}. Score: ${marksObtained}/${exam.totalMarks}`, req);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Enter Student Marks manually (for Offline or Mixed Exams)
// @route   POST /api/exams/:id/marks
// @access  Private (Admin / Teacher)
const enterOfflineMarks = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    const access = await hasVillageAccess(req.user, exam.villageId);
    if (!access) {
      res.status(403);
      throw new Error('Not authorized to grade this exam');
    }

    const { marksRecords } = req.body; // Array of { studentId, marksObtained }
    if (!marksRecords || !Array.isArray(marksRecords)) {
      res.status(400);
      throw new Error('Provide marksRecords array');
    }

    const results = [];
    for (const record of marksRecords) {
      const { studentId, marksObtained } = record;
      const isPassed = marksObtained >= exam.passingMarks;

      const resDoc = await Result.findOneAndUpdate(
        { examId: exam._id, studentId },
        {
          marksObtained,
          isPassed,
          gradedBy: req.user._id
        },
        { upsert: true, new: true }
      );
      results.push(resDoc);
    }

    await logActivity(req.user._id, 'ENTER_MARKS', `Recorded marks for exam: ${exam.title}`, req);

    res.json({ message: 'Marks entered successfully', count: results.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish exam results to students
// @route   PUT /api/exams/:id/publish
// @access  Private (Admin / Teacher)
const publishResults = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    const access = await hasVillageAccess(req.user, exam.villageId);
    if (!access) {
      res.status(403);
      throw new Error('Not authorized to publish results for this exam');
    }

    await Result.updateMany({ examId: exam._id }, { published: true });

    await logActivity(req.user._id, 'PUBLISH_RESULTS', `Published results for: ${exam.title}`, req);

    res.json({ message: 'Results published successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get results for an exam
// @route   GET /api/exams/:id/results
// @access  Private
const getExamResults = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const exam = await Exam.findById(examId);
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    if (req.user.role === 'Student') {
      const result = await Result.findOne({ examId, studentId: req.user._id, published: true })
        .populate('studentId', 'name username');
      return res.json(result ? [result] : []);
    }

    // Teacher/Admin can view all results for the exam
    const results = await Result.find({ examId })
      .populate('studentId', 'name username');

    res.json(results);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student Report Card (All published results of student)
// @route   GET /api/exams/student/:studentId/report-card
// @access  Private (Admin / Teacher / Student himself)
const getStudentReportCard = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;

    if (req.user.role === 'Student' && req.user._id.toString() !== studentId) {
      res.status(403);
      throw new Error('Unauthorized');
    }

    const results = await Result.find({ studentId, published: true })
      .populate({
        path: 'examId',
        select: 'title type totalMarks passingMarks date',
        populate: { path: 'classId', select: 'name' }
      })
      .sort({ submittedAt: -1 });

    res.json(results);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  submitOnlineExam,
  enterOfflineMarks,
  publishResults,
  getExamResults,
  getStudentReportCard
};
