const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (Uploads fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/homework', require('./routes/homeworkRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Root endpoint status check
app.get('/', (req, res) => {
  res.send('Smart Student Management System API is running...');
});

// Error handling middleware (must be at the end)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
