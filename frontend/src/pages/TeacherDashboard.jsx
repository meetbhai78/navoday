import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { 
  Check, X, Plus, Trash2, Send, FileText, Download, 
  UserCheck, AlertCircle, Eye, Calendar, Upload, Award, ArrowLeft
} from 'lucide-react';
import Settings from './Settings';
import SpringboardGrid from '../components/SpringboardGrid';

const TeacherDashboard = ({ tab, setTab }) => {
  const { t } = useLanguage();
  const { user } = useSelector((state) => state.auth);
  const config = {
    headers: { Authorization: `Bearer ${user.token}` }
  };

  // Dashboard Stats State
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Meta collections (Villages and Classes under teacher control)
  const [villages, setVillages] = useState([]);
  const [classes, setClasses] = useState([]);

  // Attendance states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentsList, setStudentsList] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: 'Present' | 'Absent' }
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Exams states
  const [exams, setExams] = useState([]);
  const [gradingExam, setGradingExam] = useState(null); // Exam selected for grading
  const [marksRecords, setMarksRecords] = useState({}); // { studentId: marks }
  const [showExamModal, setShowExamModal] = useState(false);
  const [newExamData, setNewExamData] = useState({
    title: '', type: 'Online', date: '', time: '', durationMinutes: 30, totalMarks: 10, passingMarks: 4, questions: []
  });
  const [newQuestion, setNewQuestion] = useState({
    questionText: '', type: 'MCQ', options: ['', '', '', ''], correctOptionIndex: 0, marks: 2
  });

  // Homework & Study materials state
  const [homeworkList, setHomeworkList] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [viewingSubmissionsHw, setViewingSubmissionsHw] = useState(null); // hw item for submissions view
  const [submissions, setSubmissions] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null); // sub item being graded
  const [gradeRemarks, setGradeRemarks] = useState({ status: 'Graded', remarks: '' });
  
  const [hwFile, setHwFile] = useState(null);
  const [matFile, setMatFile] = useState(null);
  const [hwFormData, setHwFormData] = useState({ title: '', description: '', subject: '', classId: '', villageId: '', dueDate: '' });
  const [matFormData, setMatFormData] = useState({ title: '', description: '', subject: '', classId: '' });

  // Messaging states
  const [messages, setMessages] = useState([]);
  const [msgFormData, setMsgFormData] = useState({ scope: 'Individual', receiverId: '', villageId: '', content: '' });
  const [allStudents, setAllStudents] = useState([]); // for individual receiver dropdown

  // Initial data loading
  const fetchMeta = async () => {
    try {
      // Get teacher's profile to extract assigned villages
      const profRes = await axios.get('/api/auth/profile', config);
      setVillages(profRes.data.profile?.villageIds || []);
      
      // Get all classes
      const clsRes = await axios.get('/api/auth/classes', config); // using public api
      setClasses(clsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get('/api/dashboard/teacher', config);
      setStats(res.data);
      setLoadingStats(false);
    } catch (err) {
      console.error(err);
      setLoadingStats(false);
    }
  };

  const fetchExams = async () => {
    const res = await axios.get('/api/exams', config);
    setExams(res.data);
  };

  const fetchHomework = async () => {
    const res = await axios.get('/api/homework', config);
    setHomeworkList(res.data);
    const matRes = await axios.get('/api/homework/materials', config);
    setMaterialsList(matRes.data);
  };

  const fetchMessages = async () => {
    const res = await axios.get('/api/messages', config);
    setMessages(res.data);
    
    // Also fetch all students for message receiver list
    const stRes = await axios.get('/api/auth/students', config);
    setAllStudents(stRes.data);
  };

  useEffect(() => {
    if (tab === 'dashboard') fetchDashboardStats();
    if (tab === 'exams') fetchExams();
    if (tab === 'homework') fetchHomework();
    if (tab === 'messages') fetchMessages();
  }, [tab]);

  // ==================== ATTENDANCE ACTIONS ====================

  const handleFetchAttendanceList = async () => {
    if (!selectedClass || !selectedVillage) return alert('Select class and village');
    try {
      setLoadingAttendance(true);
      const res = await axios.get(`/api/attendance/list?classId=${selectedClass}&villageId=${selectedVillage}&date=${selectedDate}`, config);
      setStudentsList(res.data);
      
      // Seed records mapping
      const initialMap = {};
      res.data.forEach(st => {
        initialMap[st.studentId] = st.status || 'Present'; // default to Present if unmarked
      });
      setAttendanceRecords(initialMap);
      setLoadingAttendance(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
      setLoadingAttendance(false);
    }
  };

  const toggleAttendanceStatus = (stId) => {
    const current = attendanceRecords[stId];
    setAttendanceRecords({
      ...attendanceRecords,
      [stId]: current === 'Present' ? 'Absent' : 'Present'
    });
  };

  const handleSaveAttendance = async () => {
    try {
      const records = Object.keys(attendanceRecords).map(studentId => ({
        studentId,
        status: attendanceRecords[studentId]
      }));
      await axios.post('/api/attendance/mark', {
        classId: selectedClass,
        villageId: selectedVillage,
        date: selectedDate,
        records
      }, config);
      alert('Attendance saved successfully');
      handleFetchAttendanceList();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // ==================== EXAM ACTIONS ====================

  const handleAddQuestion = () => {
    if (!newQuestion.questionText) return alert('Enter question text');
    setNewExamData({
      ...newExamData,
      questions: [...newExamData.questions, newQuestion]
    });
    setNewQuestion({ questionText: '', type: 'MCQ', options: ['', '', '', ''], correctOptionIndex: 0, marks: 2 });
  };

  const handleCreateExamSubmit = async (e) => {
    e.preventDefault();
    if (!newExamData.classId) return alert('Select class');
    try {
      await axios.post('/api/exams', newExamData, config);
      setShowExamModal(false);
      setNewExamData({ title: '', type: 'Online', date: '', time: '', durationMinutes: 30, totalMarks: 10, passingMarks: 4, questions: [] });
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const startGrading = async (exam) => {
    setGradingExam(exam);
    try {
      // Get student list for the exam village/class
      const stRes = await axios.get(`/api/attendance/list?classId=${exam.classId._id}&villageId=${exam.villageId?._id || villages[0]?._id}&date=${new Date().toISOString().split('T')[0]}`, config);
      
      // Get existing results
      const resRes = await axios.get(`/api/exams/${exam._id}/results`, config);
      const resultsMap = {};
      resRes.data.forEach(r => {
        resultsMap[r.studentId._id] = r.marksObtained;
      });

      const initialMarks = {};
      stRes.data.forEach(st => {
        initialMarks[st.studentId] = resultsMap[st.studentId] !== undefined ? resultsMap[st.studentId] : '';
      });

      setMarksRecords(initialMarks);
      setStudentsList(stRes.data);
    } catch (err) {
      alert('Error initiating grading');
    }
  };

  const saveOfflineMarks = async () => {
    try {
      const records = Object.keys(marksRecords).map(studentId => ({
        studentId,
        marksObtained: Number(marksRecords[studentId])
      }));
      await axios.post(`/api/exams/${gradingExam._id}/marks`, { marksRecords: records }, config);
      alert('Marks saved successfully');
      setGradingExam(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handlePublishResults = async (examId) => {
    if (!window.confirm('Publish results? This will make marks visible to students.')) return;
    try {
      await axios.put(`/api/exams/${examId}/publish`, {}, config);
      alert('Results published!');
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // ==================== HOMEWORK / NOTES ACTIONS ====================

  const handleCreateHw = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', hwFormData.title);
    data.append('description', hwFormData.description);
    data.append('subject', hwFormData.subject);
    data.append('classId', hwFormData.classId);
    data.append('villageId', hwFormData.villageId);
    data.append('dueDate', hwFormData.dueDate);
    if (hwFile) data.append('file', hwFile);

    try {
      await axios.post('/api/homework', data, {
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Homework uploaded');
      setHwFormData({ title: '', description: '', subject: '', classId: '', villageId: '', dueDate: '' });
      setHwFile(null);
      fetchHomework();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleCreateMat = async (e) => {
    e.preventDefault();
    if (!matFile) return alert('Please select a file to upload');
    const data = new FormData();
    data.append('title', matFormData.title);
    data.append('description', matFormData.description);
    data.append('subject', matFormData.subject);
    data.append('classId', matFormData.classId);
    data.append('file', matFile);

    try {
      await axios.post('/api/homework/materials', data, {
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Study material uploaded');
      setMatFormData({ title: '', description: '', subject: '', classId: '' });
      setMatFile(null);
      fetchHomework();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const deleteHw = async (id) => {
    if (!window.confirm('Delete homework?')) return;
    await axios.delete(`/api/homework/${id}`, config);
    fetchHomework();
  };

  const deleteMat = async (id) => {
    if (!window.confirm('Delete study material?')) return;
    await axios.delete(`/api/homework/materials/${id}`, config);
    fetchHomework();
  };

  const viewHwSubmissions = async (hw) => {
    setViewingSubmissionsHw(hw);
    const res = await axios.get(`/api/homework/${hw._id}/submissions`, config);
    setSubmissions(res.data);
  };

  const submitGrade = async (e) => {
    e.preventDefault();
    await axios.put(`/api/homework/submission/${gradingSubmission._id}/grade`, gradeRemarks, config);
    alert('Grade submitted');
    setGradingSubmission(null);
    viewHwSubmissions(viewingSubmissionsHw);
  };

  // ==================== MESSAGING ACTIONS ====================

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/messages', msgFormData, config);
      alert('Message sent successfully!');
      setMsgFormData({ scope: 'Individual', receiverId: '', villageId: '', content: '' });
      fetchMessages();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-sm pb-10">

      {/* Mobile Back Button for Sub-tabs */}
      {tab !== 'dashboard' && (
        <button
          onClick={() => setTab('dashboard')}
          className="md:hidden flex items-center space-x-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl mb-4 font-semibold shadow-md active:scale-95 transition"
        >
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </button>
      )}
      
      {/* Active Tab: Dashboard Stats */}
      {tab === 'dashboard' && stats && (
        <div className="space-y-8">
          <SpringboardGrid role={user.role} setTab={setTab} />
          {/* Summary metrics widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 flex items-center space-x-4">
              <span className="text-4xl">🎓</span>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Students Under Care</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.metrics.totalStudents}</h3>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/10 flex items-center space-x-4">
              <span className="text-4xl">✅</span>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Today's Present Students</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{stats.metrics.attendanceSnapshot.present}</h3>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-rose-500/10 flex items-center space-x-4">
              <span className="text-4xl">❌</span>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Today's Absent Students</p>
                <h3 className="text-3xl font-extrabold text-rose-400 mt-1">{stats.metrics.attendanceSnapshot.absent}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming exams */}
            <div className="glass-panel p-6 rounded-2xl">
              <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                <span className="mr-2">📅</span> Upcoming Scheduled Exams
              </h4>
              <div className="space-y-3">
                {stats.upcomingExams.length === 0 && <p className="text-slate-500 text-xs">No exams scheduled.</p>}
                {stats.upcomingExams.map((ex) => (
                  <div key={ex._id} className="flex justify-between items-center p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-semibold text-slate-200">{ex.title}</p>
                      <p className="text-xs text-slate-400">
                        {ex.classId?.name} | {ex.type} | Date: {new Date(ex.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-indigo-400 font-bold bg-indigo-950 px-2 py-1 rounded text-xs">
                      {ex.totalMarks} Marks
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Uploads Activity */}
            <div className="glass-panel p-6 rounded-2xl">
              <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                <span className="mr-2">📤</span> Recent Homework Uploaded
              </h4>
              <div className="space-y-3">
                {stats.recentActivity.homework.length === 0 && <p className="text-slate-500 text-xs">No homework uploaded yet.</p>}
                {stats.recentActivity.homework.map((hw) => (
                  <div key={hw._id} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-200">{hw.title}</p>
                      <p className="text-xs text-slate-400">Subject: {hw.subject} | Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-indigo-300 font-semibold bg-slate-800 px-2 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Tab: Attendance Marking Grid */}
      {tab === 'attendance' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📅</span> {t('mark')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Standard/Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500"
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Village</label>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500"
              >
                <option value="">Select Village</option>
                {villages.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleFetchAttendanceList}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg text-sm transition"
              >
                Load Students
              </button>
            </div>
          </div>

          {loadingAttendance ? (
            <div className="text-center text-indigo-400 py-10">Fetching student registry...</div>
          ) : studentsList.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-xs">
                      <th className="py-3 px-4">Roll</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {studentsList.map((st) => (
                      <tr key={st.studentId} className="hover:bg-slate-900/10">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-400">{st.rollNumber || '-'}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-200">{st.name}</td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">@{st.username}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => toggleAttendanceStatus(st.studentId)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                              attendanceRecords[st.studentId] === 'Present'
                                ? 'bg-emerald-950 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-950/20'
                                : 'bg-rose-950 border border-rose-500/30 text-rose-400 shadow-md shadow-rose-950/20'
                            }`}
                          >
                            {attendanceRecords[st.studentId] === 'Present' ? t('present') : t('absent')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveAttendance}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/15"
                >
                  Save Attendance
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-10 bg-slate-900/10 rounded-xl border border-slate-850">
              No active students found in the selected village and class.
            </div>
          )}
        </div>
      )}

      {/* Active Tab: Exams Schedule and Grading */}
      {tab === 'exams' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📝</span> Exams Scheduler</h3>
            <button
              onClick={() => setShowExamModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 transition"
            >
              <Plus size={16} /> <span>{t('createExam')}</span>
            </button>
          </div>

          {!gradingExam ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map((ex) => (
                <div key={ex._id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        ex.type === 'Online' ? 'bg-indigo-950 text-indigo-400' : 'bg-emerald-950 text-emerald-400'
                      }`}>
                        {ex.type}
                      </span>
                      <span className="text-slate-400 text-xs font-semibold">{new Date(ex.date).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-100 mt-2">{ex.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">Class: {ex.classId?.name} | Village: {ex.villageId?.name || 'Global'}</p>
                    <p className="text-xs text-slate-400 mt-1">Total Marks: {ex.totalMarks} | Passing Marks: {ex.passingMarks}</p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    {ex.type === 'Offline' && (
                      <button
                        onClick={() => startGrading(ex)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold py-2 rounded-xl flex items-center justify-center space-x-1 border border-slate-750"
                      >
                        <Award size={14} /> <span>{t('enterMarks')}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handlePublishResults(ex._id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center space-x-1"
                    >
                      <UserCheck size={14} /> <span>Publish Results</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* OFFLINE MARKS ENTRY FORM */
            <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-200">Entering Marks: {gradingExam.title}</h4>
                  <p className="text-xs text-slate-400">Class: {gradingExam.classId?.name} | Total Marks: {gradingExam.totalMarks}</p>
                </div>
                <button onClick={() => setGradingExam(null)} className="text-xs text-slate-400 hover:text-slate-200">Back</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs">
                      <th className="py-2.5">Roll No</th>
                      <th className="py-2.5">Student Name</th>
                      <th className="py-2.5">Marks Obtained</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map(st => (
                      <tr key={st.studentId} className="border-b border-slate-850">
                        <td className="py-3 font-mono font-bold text-indigo-400">{st.rollNumber || '-'}</td>
                        <td className="py-3 font-semibold text-slate-200">{st.name}</td>
                        <td className="py-3">
                          <input
                            type="number"
                            min="0"
                            max={gradingExam.totalMarks}
                            value={marksRecords[st.studentId] || ''}
                            onChange={(e) => setMarksRecords({ ...marksRecords, [st.studentId]: e.target.value })}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 w-24 focus:border-indigo-500"
                            required
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button onClick={() => setGradingExam(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-sm">Cancel</button>
                <button onClick={saveOfflineMarks} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md">Save Marks</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Tab: Homework Manager */}
      {tab === 'homework' && (
        <div className="space-y-8">
          
          {!viewingSubmissionsHw ? (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📚</span> Homework Manager</h3>

                <form onSubmit={handleCreateHw} className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Homework Title *</label>
                      <input
                        type="text"
                        value={hwFormData.title}
                        onChange={(e) => setHwFormData({ ...hwFormData, title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Subject *</label>
                      <input
                        type="text"
                        value={hwFormData.subject}
                        placeholder="e.g. Maths, Science"
                        onChange={(e) => setHwFormData({ ...hwFormData, subject: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Class *</label>
                      <select
                        value={hwFormData.classId}
                        onChange={(e) => setHwFormData({ ...hwFormData, classId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                        required
                      >
                        <option value="">Select</option>
                        {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Target Village *</label>
                      <select
                        value={hwFormData.villageId}
                        onChange={(e) => setHwFormData({ ...hwFormData, villageId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                        required
                      >
                        <option value="">Select</option>
                        {villages.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Due Date *</label>
                      <input
                        type="date"
                        value={hwFormData.dueDate}
                        onChange={(e) => setHwFormData({ ...hwFormData, dueDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Instructions / Description</label>
                    <textarea
                      value={hwFormData.description}
                      onChange={(e) => setHwFormData({ ...hwFormData, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs h-16 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Attachment File (PDF/Image)</label>
                    <input
                      type="file"
                      onChange={(e) => setHwFile(e.target.files[0])}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs flex justify-center items-center space-x-1.5 transition shadow"
                  >
                    <Upload size={14} /> <span>Upload Homework</span>
                  </button>
                </form>

                {/* Homework List */}
                <div className="space-y-3">
                  {homeworkList.map((hw) => (
                    <div key={hw._id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-200">{hw.title}</h4>
                        <p className="text-xs text-slate-500">
                          {hw.subject} | Class: {hw.classId?.name} | Village: {hw.villageId?.name} | Due: {new Date(hw.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewHwSubmissions(hw)}
                          className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs px-3 py-1.5 rounded-lg border border-indigo-550/20 transition font-bold"
                        >
                          Submissions
                        </button>
                        <button
                          onClick={() => deleteHw(hw._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          ) : (
            /* SUBMISSIONS VIEW */
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <h3 className="text-xl font-bold">Submissions: {viewingSubmissionsHw.title}</h3>
                  <p className="text-xs text-slate-400">Class: {viewingSubmissionsHw.classId?.name} | Subject: {viewingSubmissionsHw.subject}</p>
                </div>
                <button onClick={() => setViewingSubmissionsHw(null)} className="text-slate-400 hover:text-slate-200">Back</button>
              </div>

              {!gradingSubmission ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs">
                        <th className="py-2.5 px-4">Student</th>
                        <th className="py-2.5 px-4">Submitted At</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Remarks</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {submissions.map(sub => (
                        <tr key={sub._id} className="hover:bg-slate-900/10">
                          <td className="py-3 px-4 font-semibold text-slate-200">{sub.studentId?.name}</td>
                          <td className="py-3 px-4 text-xs text-slate-400">{new Date(sub.submittedAt).toLocaleString()}</td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              sub.status === 'Graded' ? 'bg-emerald-950 text-emerald-400' : 'bg-indigo-950 text-indigo-400'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 italic text-xs">{sub.remarks || '-'}</td>
                          <td className="py-3 px-4 text-right flex justify-end space-x-2">
                            {sub.fileUrl && (
                              <a
                                href={sub.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-slate-800 text-indigo-300 px-3 py-1.5 rounded-lg border border-slate-750 text-xs flex items-center space-x-1"
                              >
                                <Download size={13} /> <span>File</span>
                              </a>
                            )}
                            <button
                              onClick={() => { setGradingSubmission(sub); setGradeRemarks({ status: 'Graded', remarks: sub.remarks || '' }); }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                            >
                              Grade
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* GRADING VIEW (grading a submission) */
                <form onSubmit={submitGrade} className="max-w-md bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="font-bold text-slate-200">Grading Submission: {gradingSubmission.studentId?.name}</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                    <select
                      value={gradeRemarks.status}
                      onChange={(e) => setGradeRemarks({ ...gradeRemarks, status: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300"
                    >
                      <option value="Graded">Graded (Accepted)</option>
                      <option value="Pending">Needs Correction</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Remarks / Comments</label>
                    <textarea
                      value={gradeRemarks.remarks}
                      onChange={(e) => setGradeRemarks({ ...gradeRemarks, remarks: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 h-24"
                      placeholder="Excellent work, well explained."
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button type="button" onClick={() => setGradingSubmission(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-sm">Cancel</button>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md">Submit Grade</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Tab: Digital Library Notes */}
      {tab === 'notes' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📄</span> Digital Library Notes</h3>

          <form onSubmit={handleCreateMat} className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-850">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Material Title *</label>
                <input
                  type="text"
                  value={matFormData.title}
                  onChange={(e) => setMatFormData({ ...matFormData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject *</label>
                <input
                  type="text"
                  value={matFormData.subject}
                  onChange={(e) => setMatFormData({ ...matFormData, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Class *</label>
              <select
                value={matFormData.classId}
                onChange={(e) => setMatFormData({ ...matFormData, classId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                required
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Upload PDF Document *</label>
              <input
                type="file"
                onChange={(e) => setMatFile(e.target.files[0])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs flex justify-center items-center space-x-1.5 transition shadow"
            >
              <Upload size={14} /> <span>Upload Study Material</span>
            </button>
          </form>

          {/* Materials List */}
          <div className="space-y-3">
            {materialsList.map((mat) => (
              <div key={mat._id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-200">{mat.title}</h4>
                  <p className="text-xs text-slate-500">{mat.subject} | Class: {mat.classId?.name}</p>
                </div>
                <div className="flex space-x-2">
                  {mat.fileUrl && (
                    <a
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-indigo-400 hover:bg-indigo-950/20 rounded-lg transition"
                    >
                      <Download size={15} />
                    </a>
                  )}
                  <button
                    onClick={() => deleteMat(mat._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Active Tab: Compose Messages & Notifications */}
      {tab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Compose Form */}
          <div className="glass-panel p-6 rounded-2xl space-y-6 col-span-1 lg:col-span-1">
            <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📧</span> Send Messages</h3>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Scope</label>
                <select
                  value={msgFormData.scope}
                  onChange={(e) => setMsgFormData({ ...msgFormData, scope: e.target.value, receiverId: '', villageId: '' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-350 focus:border-indigo-500"
                >
                  <option value="Individual">Individual Student</option>
                  <option value="Village">Specific Village</option>
                  <option value="Global">Broadcast to all Villages</option>
                </select>
              </div>

              {msgFormData.scope === 'Individual' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Select Student</label>
                  <select
                    value={msgFormData.receiverId}
                    onChange={(e) => setMsgFormData({ ...msgFormData, receiverId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Student</option>
                    {allStudents.map(st => (
                      <option key={st.user._id} value={st.user._id}>
                        {st.user.name} ({st.profile?.villageId?.name || 'No Village'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {msgFormData.scope === 'Village' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Select Village</label>
                  <select
                    value={msgFormData.villageId}
                    onChange={(e) => setMsgFormData({ ...msgFormData, villageId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Village</option>
                    {villages.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Message Content</label>
                <textarea
                  value={msgFormData.content}
                  onChange={(e) => setMsgFormData({ ...msgFormData, content: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 h-28 focus:border-indigo-500"
                  placeholder="Enter message text here..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl flex justify-center items-center space-x-1.5 transition shadow"
              >
                <Send size={15} /> <span>Send Message</span>
              </button>
            </form>
          </div>

          {/* Right panel: Sent Box list */}
          <div className="glass-panel p-6 rounded-2xl space-y-6 col-span-1 lg:col-span-2">
            <h3 className="text-xl font-bold">Sent Message Box</h3>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {messages.length === 0 && <p className="text-slate-500 text-sm">No messages sent yet.</p>}
              {messages.map((msg) => (
                <div key={msg._id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="px-2 py-0.5 rounded font-bold bg-indigo-950 text-indigo-400 border border-indigo-900/30">
                      Scope: {msg.scope}
                    </span>
                    <span className="text-slate-500">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  
                  {msg.scope === 'Individual' && (
                    <p className="text-xs text-slate-400 font-semibold">To: <span className="text-indigo-300 font-bold">{msg.receiverId?.name}</span></p>
                  )}
                  {msg.scope === 'Village' && (
                    <p className="text-xs text-slate-400 font-semibold">To Village: <span className="text-indigo-300 font-bold">{msg.villageId?.name}</span></p>
                  )}
                  {msg.scope === 'Global' && (
                    <p className="text-xs text-slate-400 font-semibold">To: All Villages</p>
                  )}
                  
                  <p className="text-slate-200 text-sm bg-slate-950/30 p-2.5 rounded-lg border border-slate-850/60 leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Tab: Settings */}
      {tab === 'settings' && (
        <Settings />
      )}

      {/* POPUP EXAM SCHEDULER MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-lg font-bold text-slate-100 uppercase tracking-wide">Schedule New Exam</h4>
              <button onClick={() => setShowExamModal(false)} className="text-slate-400 hover:text-slate-100 text-lg">×</button>
            </div>

            <form onSubmit={handleCreateExamSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Exam Title *</label>
                  <input
                    type="text"
                    value={newExamData.title}
                    onChange={(e) => setNewExamData({ ...newExamData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                    placeholder="e.g. Science Chapter 1 Test"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Exam Type *</label>
                  <select
                    value={newExamData.type}
                    onChange={(e) => setNewExamData({ ...newExamData, type: e.target.value, questions: [] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 font-semibold"
                  >
                    <option value="Online">Online Test (MCQs)</option>
                    <option value="Offline">Offline Grades (Marks sheet)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Class *</label>
                  <select
                    value={newExamData.classId}
                    onChange={(e) => setNewExamData({ ...newExamData, classId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                    required
                  >
                    <option value="">Select</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Village (Optional)</label>
                  <select
                    value={newExamData.villageId || ''}
                    onChange={(e) => setNewExamData({ ...newExamData, villageId: e.target.value || null })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                  >
                    <option value="">Global / All</option>
                    {villages.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newExamData.date}
                    onChange={(e) => setNewExamData({ ...newExamData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Time</label>
                  <input
                    type="text"
                    value={newExamData.time}
                    placeholder="e.g. 10:00 AM"
                    onChange={(e) => setNewExamData({ ...newExamData, time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={newExamData.durationMinutes}
                    onChange={(e) => setNewExamData({ ...newExamData, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Total Marks *</label>
                  <input
                    type="number"
                    value={newExamData.totalMarks}
                    onChange={(e) => setNewExamData({ ...newExamData, totalMarks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Passing Marks *</label>
                  <input
                    type="number"
                    value={newExamData.passingMarks}
                    onChange={(e) => setNewExamData({ ...newExamData, passingMarks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Online Exam MCQ Builder */}
              {newExamData.type === 'Online' && (
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h5 className="font-bold text-indigo-400 text-xs">Add MCQ Question</h5>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Question Text</label>
                    <input
                      type="text"
                      value={newQuestion.questionText}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs"
                      placeholder="e.g. What is the value of Pi?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {newQuestion.options.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newQuestion.options];
                          updated[idx] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: updated });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Correct Option (1-4)</label>
                      <select
                        value={newQuestion.correctOptionIndex}
                        onChange={(e) => setNewQuestion({ ...newQuestion, correctOptionIndex: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                      >
                        <option value={0}>Option 1</option>
                        <option value={1}>Option 2</option>
                        <option value={2}>Option 3</option>
                        <option value={3}>Option 4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Question Marks</label>
                      <input
                        type="number"
                        value={newQuestion.marks}
                        onChange={(e) => setNewQuestion({ ...newQuestion, marks: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="bg-indigo-950 text-indigo-400 border border-indigo-900 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    + Add Question to Exam
                  </button>

                  <div className="space-y-1 bg-slate-950 p-3 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none font-bold mb-2">Questions Added ({newExamData.questions.length})</p>
                    {newExamData.questions.map((q, idx) => (
                      <p key={idx} className="text-xs text-slate-300 font-medium">Q{idx + 1}: {q.questionText} ({q.marks} pts)</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-sm"
                >
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
