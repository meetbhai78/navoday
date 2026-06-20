const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Village = require('./models/Village');
const Class = require('./models/Class');
const TeacherProfile = require('./models/TeacherProfile');
const StudentProfile = require('./models/StudentProfile');
const Exam = require('./models/Exam');
const Homework = require('./models/Homework');
const Announcement = require('./models/Announcement');

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/navoday';

const seedDB = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected. Cleaning database collections...');

    // Drop collections
    await User.deleteMany();
    await Village.deleteMany();
    await Class.deleteMany();
    await TeacherProfile.deleteMany();
    await StudentProfile.deleteMany();
    await Exam.deleteMany();
    await Homework.deleteMany();
    await Announcement.deleteMany();

    console.log('Seeding Villages...');
    const v1 = await Village.create({ name: 'Navsari', code: 'NAV01', district: 'Navsari', state: 'Gujarat' });
    const v2 = await Village.create({ name: 'Dharampur', code: 'DHP01', district: 'Valsad', state: 'Gujarat' });
    const v3 = await Village.create({ name: 'Bardoli', code: 'BDL01', district: 'Surat', state: 'Gujarat' });

    console.log('Seeding Classes...');
    const c1 = await Class.create({ name: 'Standard 10', code: 'STD10' });
    const c2 = await Class.create({ name: 'Standard 12', code: 'STD12' });

    console.log('Seeding Users...');
    // 1. Admin
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'Admin',
      name: 'System Admin',
      email: 'admin@navoday.org',
      phone: '9998887770',
      languagePreference: 'en',
      status: 'Active'
    });

    // 2. Teachers
    const teacher1 = await User.create({
      username: 'teacher1',
      password: 'teacher123',
      role: 'Teacher',
      name: 'Kishorbhai Patel',
      email: 'kishor@navoday.org',
      phone: '9998887771',
      languagePreference: 'gu',
      status: 'Active'
    });
    const tProfile1 = await TeacherProfile.create({
      userId: teacher1._id,
      villageIds: [v1._id, v2._id],
      specialization: 'Maths and Science'
    });

    const teacher2 = await User.create({
      username: 'teacher2',
      password: 'teacher223',
      role: 'Teacher',
      name: 'Anilbhai Mehta',
      email: 'anil@navoday.org',
      phone: '9998887772',
      languagePreference: 'gu',
      status: 'Active'
    });
    const tProfile2 = await TeacherProfile.create({
      userId: teacher2._id,
      villageIds: [v3._id],
      specialization: 'English and Gujarati'
    });

    // 3. Students
    const student1 = await User.create({
      username: 'student1',
      password: 'student123',
      role: 'Student',
      name: 'Rajesh Parmar',
      email: 'rajesh@navoday.org',
      phone: '9998887773',
      languagePreference: 'gu',
      status: 'Active'
    });
    await StudentProfile.create({
      userId: student1._id,
      rollNumber: '1001',
      classId: c1._id,
      villageId: v1._id,
      guardianName: 'Ramanbhai Parmar',
      guardianPhone: '9876543210'
    });

    const student2 = await User.create({
      username: 'student2',
      password: 'student223',
      role: 'Student',
      name: 'Amit Shah',
      email: 'amit@navoday.org',
      phone: '9998887774',
      languagePreference: 'gu',
      status: 'Active'
    });
    await StudentProfile.create({
      userId: student2._id,
      rollNumber: '1002',
      classId: c2._id,
      villageId: v2._id,
      guardianName: 'Nitinbhai Shah',
      guardianPhone: '9876543211'
    });

    const student3 = await User.create({
      username: 'student3',
      password: 'student323',
      role: 'Student',
      name: 'Divya Patel',
      email: 'divya@navoday.org',
      phone: '9998887775',
      languagePreference: 'gu',
      status: 'Active'
    });
    await StudentProfile.create({
      userId: student3._id,
      rollNumber: '1003',
      classId: c1._id,
      villageId: v3._id,
      guardianName: 'Manubhai Patel',
      guardianPhone: '9876543212'
    });

    console.log('Seeding Exams...');
    // Create Offline Exam
    await Exam.create({
      title: 'Maths Chapter 1 Offline Test',
      type: 'Offline',
      classId: c1._id,
      villageId: v1._id,
      date: new Date(),
      time: '10:00 AM',
      totalMarks: 50,
      passingMarks: 17,
      createdBy: teacher1._id
    });

    // Create Online MCQ Exam
    await Exam.create({
      title: 'Science General MCQ Quiz',
      type: 'Online',
      classId: c1._id,
      villageId: v1._id,
      date: new Date(),
      time: '02:00 PM',
      durationMinutes: 20,
      totalMarks: 10,
      passingMarks: 4,
      questions: [
        {
          questionText: 'What is the chemical formula of Water?',
          type: 'MCQ',
          options: ['CO2', 'H2O', 'NaCl', 'O2'],
          correctOptionIndex: 1,
          marks: 5
        },
        {
          questionText: 'How many planets are in our solar system?',
          type: 'MCQ',
          options: ['7', '8', '9', '10'],
          correctOptionIndex: 1,
          marks: 5
        }
      ],
      createdBy: teacher1._id
    });

    console.log('Seeding Announcements...');
    await Announcement.create({
      title: 'Welcome to Navoday Smart Attendance System!',
      content: 'All teachers are requested to record daily student attendance before 11:00 AM. Students can take online tests and download notes directly from their respective portals.',
      createdBy: admin._id
    });

    // Create dummy files uploads folder fallback
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, 'dummy-math-homework.pdf'), 'Dummy PDF notes file contents for student downloads test.');

    console.log('Seeding Homework...');
    await Homework.create({
      title: 'Maths Algebra Homework',
      description: 'Solve questions 1 to 10 in standard worksheets.',
      subject: 'Maths',
      classId: c1._id,
      villageId: v1._id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 3), // 3 days from now
      fileUrl: '/uploads/dummy-math-homework.pdf',
      createdBy: teacher1._id
    });

    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
