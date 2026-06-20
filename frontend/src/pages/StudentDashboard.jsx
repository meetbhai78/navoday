import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { 
  Download, Clock, CheckCircle, AlertCircle, FileText, 
  ChevronRight, Award, Bell, Mail, RefreshCw, Send, Check, ArrowLeft
} from 'lucide-react';
import Settings from './Settings';
import SpringboardGrid from '../components/SpringboardGrid';

const StudentDashboard = ({ tab, setTab }) => {
  const { t } = useLanguage();
  const { user } = useSelector((state) => state.auth);
  const config = {
    headers: { Authorization: `Bearer ${user.token}` }
  };

  // Dashboard Stats State
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Subpage states
  const [attendance, setAttendance] = useState([]);
  const [exams, setExams] = useState([]);
  const [homework, setHomework] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingGrid, setLoadingGrid] = useState(false);

  // Online Exam taking state
  const [activeTest, setActiveTest] = useState(null); // Exam details during a test
  const [testAnswers, setTestAnswers] = useState({}); // { questionId: selectedOptionIndex }
  const [testFinished, setTestFinished] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Homework file submit state
  const [submittingHwId, setSubmittingHwId] = useState(null);
  const [hwSubmitFile, setHwSubmitFile] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get('/api/dashboard/student', config);
      setStats(res.data);
      setLoadingStats(false);
    } catch (err) {
      console.error(err);
      setLoadingStats(false);
    }
  };

  const fetchSubpageData = async () => {
    try {
      setLoadingGrid(true);
      if (tab === 'dashboard') {
        fetchDashboardStats();
      } else if (tab === 'attendance') {
        const res = await axios.get(`/api/attendance/student/${user._id}`, config);
        setAttendance(res.data);
      } else if (tab === 'exams') {
        const res = await axios.get('/api/exams', config);
        setExams(res.data);
      } else if (tab === 'homework') {
        const res = await axios.get('/api/homework', config);
        setHomework(res.data);
        const matRes = await axios.get('/api/homework/materials', config);
        setMaterials(matRes.data);
      } else if (tab === 'messages') {
        const res = await axios.get('/api/messages', config);
        setMessages(res.data);
      }
      setLoadingGrid(false);
    } catch (err) {
      console.error(err);
      setLoadingGrid(false);
    }
  };

  useEffect(() => {
    fetchSubpageData();
  }, [tab]);

  // ==================== ONLINE EXAM ACTIONS ====================

  const handleStartTest = async (examId) => {
    try {
      const res = await axios.get(`/api/exams/${examId}`, config);
      if (res.data.taken) {
        alert('You have already taken this test');
        setTestResult(res.data.result);
        return;
      }
      setActiveTest(res.data.exam);
      setTestAnswers({});
      setTestFinished(false);
      setTestResult(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleOptionSelect = (qId, optionIdx) => {
    setTestAnswers({
      ...testAnswers,
      [qId]: optionIdx
    });
  };

  const handleSubmitTest = async () => {
    if (!window.confirm('Submit test answers?')) return;
    try {
      const submissions = Object.keys(testAnswers).map(questionId => ({
        questionId,
        selectedOptionIndex: testAnswers[questionId]
      }));

      const res = await axios.post(`/api/exams/${activeTest._id}/submit`, { submissions }, config);
      setTestResult(res.data);
      setTestFinished(true);
      fetchSubpageData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // ==================== HOMEWORK SUBMIT ACTIONS ====================

  const handleHwSubmit = async (e) => {
    e.preventDefault();
    if (!hwSubmitFile) return alert('Select file');
    const data = new FormData();
    data.append('file', hwSubmitFile);

    try {
      await axios.post(`/api/homework/${submittingHwId}/submit`, data, {
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Homework submitted successfully!');
      setSubmittingHwId(null);
      setHwSubmitFile(null);
      fetchSubpageData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // ==================== MESSAGE READ ACTIONS ====================

  const handleMessageOpen = async (msgId) => {
    try {
      // Find message locally
      const updatedMessages = messages.map(msg => {
        if (msg._id === msgId) {
          return { ...msg, isRead: true };
        }
        return msg;
      });
      setMessages(updatedMessages);

      // Trigger read state sync in backend
      await axios.put(`/api/messages/${msgId}/read`, {}, config);
    } catch (err) {
      console.error(err);
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

      {/* Active Tab: Student Dashboard widget */}
      {tab === 'dashboard' && stats && (
        <div className="space-y-8">
          
          <SpringboardGrid role={user.role} setTab={setTab} />

          {/* Summary metrics row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 flex items-center space-x-4">
              <span className="text-4xl">📊</span>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('attendance')}</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.metrics.attendancePercentage}%</h3>
              </div>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/10 flex items-center space-x-4">
              <span className="text-4xl">✉️</span>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('unread')} Messages</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.metrics.unreadMessagesCount}</h3>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-pink-500/10 flex items-center space-x-4">
              <span className="text-4xl">📚</span>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Upcoming Reminders</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.upcomingExams.length} Exams</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Center column: latest grades and upcoming exams */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming exams reminders */}
              <div className="glass-panel p-6 rounded-2xl">
                <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                  <span className="mr-2">📅</span> Upcoming Exam Schedule
                </h4>
                <div className="space-y-3">
                  {stats.upcomingExams.length === 0 && <p className="text-slate-500 text-xs">No exams scheduled.</p>}
                  {stats.upcomingExams.map((ex) => (
                    <div key={ex._id} className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-200">{ex.title}</p>
                        <p className="text-xs text-slate-400">Date: {new Date(ex.date).toLocaleDateString()} | Time: {ex.time || 'N/A'}</p>
                      </div>
                      {ex.type === 'Online' && (
                        <button
                          onClick={() => { setTab('exams'); handleStartTest(ex._id); }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg"
                        >
                          Take Test
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Latest published results */}
              <div className="glass-panel p-6 rounded-2xl">
                <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                  <span className="mr-2">🏆</span> Latest Results & Grades
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats.latestResults.length === 0 && <p className="text-slate-500 text-xs col-span-3">No result cards published yet.</p>}
                  {stats.latestResults.map((res) => (
                    <div key={res._id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
                      <div>
                        <p className="font-bold text-slate-200 text-sm truncate">{res.examId?.title}</p>
                        <p className="text-[10px] text-slate-500">{new Date(res.examId?.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl font-black text-indigo-400">{res.marksObtained}</span>
                        <span className="text-xs text-slate-500">/ {res.examId?.totalMarks}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${res.isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {res.isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: Announcements board */}
            <div className="glass-panel p-6 rounded-2xl col-span-1 space-y-4">
              <h4 className="text-lg font-bold text-slate-200 flex items-center">
                <span className="mr-2">📢</span> Global Announcements
              </h4>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {stats.recentAnnouncements.length === 0 && <p className="text-slate-500 text-xs">No announcements posted.</p>}
                {stats.recentAnnouncements.map((ann) => (
                  <div key={ann._id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1.5">
                    <p className="font-bold text-slate-200 text-sm leading-snug">{ann.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{ann.content}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{new Date(ann.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Tab: Attendance History (calendar style) */}
      {tab === 'attendance' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📅</span> Attendance Log</h3>
          
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Marked By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-6 text-slate-500">No attendance records found.</td>
                  </tr>
                )}
                {attendance.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-900/10">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {new Date(rec.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        rec.status === 'Present' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {rec.status === 'Present' ? t('present') : t('absent')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-semibold">{rec.markedBy?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Tab: Online MCQ Exam taking screen / Schedule */}
      {tab === 'exams' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📝</span> Exams Calendar</h3>

          {!activeTest ? (
            /* SCHEDULE LIST */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map((ex) => (
                <div key={ex._id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-md">
                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        ex.type === 'Online' ? 'bg-indigo-950 text-indigo-400' : 'bg-emerald-950 text-emerald-400'
                      }`}>
                        {ex.type}
                      </span>
                      <span className="text-slate-500 font-semibold">{new Date(ex.date).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-200 mt-2">{ex.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">Total Marks: {ex.totalMarks} | Passing Marks: {ex.passingMarks}</p>
                  </div>

                  <div className="pt-2">
                    {ex.type === 'Online' ? (
                      <button
                        onClick={() => handleStartTest(ex._id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs"
                      >
                        Enter Test Room
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartTest(ex._id)}
                        className="w-full bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-750 font-bold py-2 rounded-xl text-xs flex justify-center items-center space-x-1"
                      >
                        <Award size={14} /> <span>View Scorecard</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ONLINE EXAM INTERFACE */
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <h4 className="text-lg font-bold text-indigo-400">{activeTest.title}</h4>
                  <p className="text-xs text-slate-400">Total Questions: {activeTest.questions?.length || 0} | Duration: {activeTest.durationMinutes} mins</p>
                </div>
                <button onClick={() => { setActiveTest(null); setTestFinished(false); }} className="text-xs text-slate-400 hover:text-slate-200">Exit Test</button>
              </div>

              {!testFinished ? (
                /* QUESTION RUNNER */
                <div className="space-y-6 max-w-2xl bg-slate-900/60 p-6 rounded-2xl border border-slate-850 shadow-lg">
                  {activeTest.questions?.map((q, idx) => (
                    <div key={q._id} className="space-y-3">
                      <p className="font-semibold text-slate-200 text-base">Q{idx + 1}: {q.questionText} ({q.marks} marks)</p>
                      
                      {q.type === 'MCQ' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                          {q.options.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                                testAnswers[q._id] === optIdx
                                  ? 'bg-indigo-950 border-indigo-500/50 text-indigo-300'
                                  : 'bg-slate-950 border-slate-850 hover:bg-slate-900'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q._id}
                                checked={testAnswers[q._id] === optIdx}
                                onChange={() => handleOptionSelect(q._id, optIdx)}
                                className="border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                              />
                              <span className="text-sm font-semibold">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSubmitTest}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg"
                    >
                      Submit Exam
                    </button>
                  </div>
                </div>
              ) : (
                /* TEST SCORECARD SCREEN */
                <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
                  <span className="text-5xl block">🎉</span>
                  <div>
                    <h4 className="text-xl font-bold text-slate-100">Test Completed!</h4>
                    <p className="text-xs text-slate-400 mt-1">Your exam submission has been auto-graded.</p>
                  </div>

                  {testResult && (
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850 inline-block">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Marks Scored</p>
                      <h3 className="text-4xl font-black text-indigo-400 mt-1">
                        {testResult.marksObtained} <span className="text-xs text-slate-500">/ {activeTest.totalMarks}</span>
                      </h3>
                      <p className={`text-xs font-bold uppercase mt-2 ${testResult.isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {testResult.isPassed ? 'PASSED' : 'FAILED'}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => { setActiveTest(null); setTestFinished(false); }}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-indigo-300 font-semibold py-2.5 rounded-xl border border-slate-750 text-xs"
                  >
                    Back to Exams
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Tab: Homework Submissions and study library */}
      {tab === 'homework' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left panel: Homework logs */}
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📚</span> Assignments</h3>
            
            <div className="space-y-4">
              {homework.length === 0 && <p className="text-slate-500 text-xs">No assignments uploaded.</p>}
              {homework.map((hw) => (
                <div key={hw._id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-200">{hw.title}</h4>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">{hw.subject} | Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      hw.submissionStatus === 'Graded' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' :
                      hw.submissionStatus === 'Submitted' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/30' :
                      'bg-rose-950 text-rose-400 border border-rose-900/30'
                    }`}>
                      {hw.submissionStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/20 p-2.5 rounded-lg border border-slate-850/60">{hw.description}</p>

                  <div className="flex space-x-2 pt-1.5">
                    {hw.fileUrl && (
                      <a
                        href={hw.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-750 flex items-center space-x-1 transition"
                      >
                        <Download size={13} /> <span>Get Notes</span>
                      </a>
                    )}

                    {hw.submissionStatus === 'Pending' ? (
                      <button
                        onClick={() => setSubmittingHwId(hw._id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition"
                      >
                        Submit File
                      </button>
                    ) : (
                      <div className="text-xs text-slate-500 flex items-center space-x-1 pl-1">
                        <Check size={14} className="text-emerald-400" />
                        <span>Submitted File ({new Date(hw.submittedAt).toLocaleDateString()})</span>
                      </div>
                    )}
                  </div>

                  {hw.submissionRemarks && (
                    <div className="text-xs bg-slate-950 p-2 rounded-lg border border-slate-850">
                      <p className="font-semibold text-indigo-400">Teacher Remarks:</p>
                      <p className="text-slate-300 italic mt-0.5">"{hw.submissionRemarks}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Study notes library */}
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📖</span> Study Library</h3>
            <div className="space-y-3">
              {materials.length === 0 && <p className="text-slate-500 text-xs">No files available yet.</p>}
              {materials.map((mat) => (
                <div key={mat._id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between hover:border-indigo-500/20 transition">
                  <div>
                    <h4 className="font-bold text-slate-200">{mat.title}</h4>
                    <p className="text-xs text-slate-500">Subject: {mat.subject} | By: {mat.uploadedBy?.name}</p>
                  </div>
                  {mat.fileUrl && (
                    <a
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold p-2.5 rounded-xl border border-slate-750 transition"
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Tab: Inbox Messages */}
      {tab === 'messages' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📧</span> Message Inbox</h3>
          
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
            {messages.length === 0 && <p className="text-slate-500 text-sm">No messages in inbox.</p>}
            {messages.map((msg) => (
              <div
                key={msg._id}
                onClick={() => handleMessageOpen(msg._id)}
                className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                  msg.isRead
                    ? 'bg-slate-900/50 border-slate-850 hover:border-slate-800'
                    : 'bg-slate-900 border-indigo-500/30 shadow-md hover:bg-slate-900/80'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-indigo-300">{msg.senderId?.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      msg.senderId?.role === 'Admin' ? 'bg-indigo-950 text-indigo-400' : 'bg-purple-950 text-purple-400'
                    }`}>
                      {msg.senderId?.role}
                    </span>
                  </div>
                  <span className="text-slate-500 font-semibold">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                
                <p className="text-slate-200 text-sm mt-3 bg-slate-950/20 p-3 rounded-lg border border-slate-850/60 leading-relaxed">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POPUP SUBMIT HOMEWORK FILE MODAL */}
      {submittingHwId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Submit Assignment File</h4>
              <button onClick={() => setSubmittingHwId(null)} className="text-slate-400 hover:text-slate-100 text-lg">×</button>
            </div>

            <form onSubmit={handleHwSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select File (PDF/Image)</label>
                <input
                  type="file"
                  onChange={(e) => setHwSubmitFile(e.target.files[0])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 text-slate-300"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSubmittingHwId(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-semibold px-4 py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Tab: Settings */}
      {tab === 'settings' && (
        <Settings />
      )}
    </div>
  );
};

export default StudentDashboard;
