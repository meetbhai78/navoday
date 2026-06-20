import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { 
  Plus, Edit2, Trash2, ShieldAlert, CheckCircle, 
  Search, Eye, RefreshCw, UserCheck, Key
} from 'lucide-react';
import Settings from './Settings';

const AdminDashboard = ({ tab, setTab }) => {
  const { t } = useLanguage();
  const { user } = useSelector((state) => state.auth);
  const config = {
    headers: { Authorization: `Bearer ${user.token}` }
  };

  // Dashboard Stats State
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // CRUD Collections
  const [villages, setVillages] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingGrid, setLoadingGrid] = useState(false);

  // Form States (Modal controllers)
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'village', 'class', 'teacher', 'student'
  const [editId, setEditId] = useState(null);

  // Dynamic Fields Form State
  const [formData, setFormData] = useState({});

  // Search Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get('/api/admin/dashboard', config);
      setStats(res.data);
      setLoadingStats(false);
    } catch (err) {
      console.error(err);
      setLoadingStats(false);
    }
  };

  // Fetch Grid collections based on active tab
  const fetchGridData = async () => {
    try {
      setLoadingGrid(true);
      if (tab === 'dashboard') {
        fetchDashboardStats();
      } else if (tab === 'villages') {
        const res = await axios.get('/api/admin/villages', config);
        setVillages(res.data);
      } else if (tab === 'classes') {
        const res = await axios.get('/api/admin/classes', config);
        setClasses(res.data);
      } else if (tab === 'teachers') {
        const res = await axios.get('/api/admin/teachers', config);
        const vilRes = await axios.get('/api/admin/villages', config);
        setTeachers(res.data);
        setVillages(vilRes.data); // cache villages list for select checkboxes
      } else if (tab === 'students') {
        const res = await axios.get('/api/admin/students', config);
        const vilRes = await axios.get('/api/admin/villages', config);
        const clsRes = await axios.get('/api/admin/classes', config);
        setStudents(res.data);
        setVillages(vilRes.data);
        setClasses(clsRes.data);
      } else if (tab === 'auditLogs') {
        const res = await axios.get('/api/admin/audit-logs', config);
        setLogs(res.data);
      }
      setLoadingGrid(false);
    } catch (err) {
      console.error(err);
      setLoadingGrid(false);
    }
  };

  useEffect(() => {
    fetchGridData();
  }, [tab]);

  // Handle Create / Update Form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'village') {
        if (editId) {
          await axios.put(`/api/admin/villages/${editId}`, formData, config);
        } else {
          await axios.post('/api/admin/villages', formData, config);
        }
      } else if (modalType === 'class') {
        if (editId) {
          await axios.put(`/api/admin/classes/${editId}`, formData, config);
        } else {
          await axios.post('/api/admin/classes', formData, config);
        }
      } else if (modalType === 'teacher') {
        if (editId) {
          await axios.put(`/api/admin/teachers/${editId}`, formData, config);
        } else {
          await axios.post('/api/admin/teachers', formData, config);
        }
      } else if (modalType === 'student') {
        if (editId) {
          await axios.put(`/api/admin/students/${editId}`, formData, config);
        } else {
          await axios.post('/api/admin/students', formData, config);
        }
      }
      setShowModal(false);
      setFormData({});
      setEditId(null);
      fetchGridData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Handle Delete
  const handleDelete = async (id, type) => {
    if (!window.confirm(t('delete') + '?')) return;
    try {
      if (type === 'village') {
        await axios.delete(`/api/admin/villages/${id}`, config);
      } else if (type === 'class') {
        await axios.delete(`/api/admin/classes/${id}`, config);
      } else if (type === 'teacher') {
        await axios.delete(`/api/admin/teachers/${id}`, config);
      } else if (type === 'student') {
        await axios.delete(`/api/admin/students/${id}`, config);
      }
      fetchGridData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Prepare edit
  const startEdit = (item, type) => {
    setEditId(item._id || item.user?._id);
    setModalType(type);
    if (type === 'village' || type === 'class') {
      setFormData(item);
    } else if (type === 'teacher') {
      setFormData({
        name: item.user.name,
        username: item.user.username,
        email: item.user.email,
        phone: item.user.phone,
        status: item.user.status,
        specialization: item.profile?.specialization || '',
        villageIds: item.profile?.villageIds?.map(v => v._id || v) || []
      });
    } else if (type === 'student') {
      setFormData({
        name: item.user.name,
        username: item.user.username,
        email: item.user.email,
        phone: item.user.phone,
        status: item.user.status,
        rollNumber: item.profile?.rollNumber || '',
        classId: item.profile?.classId?._id || item.profile?.classId || '',
        villageId: item.profile?.villageId?._id || item.profile?.villageId || '',
        guardianName: item.profile?.guardianName || '',
        guardianPhone: item.profile?.guardianPhone || ''
      });
    }
    setShowModal(true);
  };

  // Prepare create
  const startCreate = (type) => {
    setEditId(null);
    setModalType(type);
    if (type === 'village') {
      setFormData({ name: '', code: '', district: '', state: '' });
    } else if (type === 'class') {
      setFormData({ name: '', code: '' });
    } else if (type === 'teacher') {
      setFormData({ username: '', password: '', name: '', email: '', phone: '', specialization: '', villageIds: [] });
    } else if (type === 'student') {
      setFormData({ username: '', password: '', name: '', email: '', phone: '', rollNumber: '', classId: '', villageId: '', guardianName: '', guardianPhone: '' });
    }
    setShowModal(true);
  };

  // Toggle teacher assigned villages in array
  const handleTeacherVillageToggle = (vId) => {
    const current = formData.villageIds || [];
    if (current.includes(vId)) {
      setFormData({ ...formData, villageIds: current.filter(id => id !== vId) });
    } else {
      setFormData({ ...formData, villageIds: [...current, vId] });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Active Tab: Dashboard Analytics */}
      {tab === 'dashboard' && (
        <>
          {loadingStats ? (
            <div className="flex items-center justify-center py-20 text-indigo-400">
              <RefreshCw className="animate-spin mr-2" /> Loading stats...
            </div>
          ) : stats && (
            <div className="space-y-8">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 flex items-center space-x-4">
                  <span className="text-4xl">🎓</span>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('totalStudents')}</p>
                    <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.metrics.totalStudents}</h3>
                  </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-purple-500/10 flex items-center space-x-4">
                  <span className="text-4xl">👨‍🏫</span>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('totalTeachers')}</p>
                    <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.metrics.totalTeachers}</h3>
                  </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-emerald-500/10 flex items-center space-x-4">
                  <span className="text-4xl">📍</span>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('villages')}</p>
                    <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.metrics.totalVillages}</h3>
                  </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-pink-500/10 flex items-center space-x-4">
                  <span className="text-4xl">📅</span>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('overallAttendance')}</p>
                    <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.metrics.overallAttendanceRate}%</h3>
                  </div>
                </div>
              </div>

              {/* Village Distributions & Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Village Distributions */}
                <div className="glass-panel p-6 rounded-2xl col-span-1 lg:col-span-2">
                  <h4 className="text-lg font-bold text-slate-200 mb-6 flex items-center">
                    <span className="mr-2">🗺️</span> Village-wise Student Count
                  </h4>
                  <div className="space-y-4">
                    {stats.villageDistribution.length === 0 && <p className="text-slate-500 text-sm">No villages created yet.</p>}
                    {stats.villageDistribution.map((v) => (
                      <div key={v.name} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-slate-300">{v.name} ({v.code})</span>
                          <span className="text-indigo-400 font-bold">{v.count} students</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full"
                            style={{ width: `${Math.min((v.count / (stats.metrics.totalStudents || 1)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Spotlights */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center mb-3">
                      <span className="mr-1.5">🏆</span> {t('topStudents')}
                    </h4>
                    <div className="space-y-2">
                      {stats.topStudents.length === 0 && <p className="text-slate-500 text-xs">No records available.</p>}
                      {stats.topStudents.map((st) => (
                        <div key={st.username} className="flex justify-between items-center text-xs bg-slate-900/60 p-2 rounded-lg border border-emerald-950/20">
                          <div>
                            <p className="font-semibold text-slate-200">{st.name}</p>
                            <p className="text-[10px] text-slate-500">{st.villageName}</p>
                          </div>
                          <span className="text-emerald-400 font-bold text-sm">{st.avgPercentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-rose-400 uppercase tracking-widest flex items-center mb-3">
                      <span className="mr-1.5">⚠️</span> {t('weakStudents')}
                    </h4>
                    <div className="space-y-2">
                      {stats.weakStudents.length === 0 && <p className="text-slate-500 text-xs">No records available.</p>}
                      {stats.weakStudents.map((st) => (
                        <div key={st.username} className="flex justify-between items-center text-xs bg-slate-900/60 p-2 rounded-lg border border-rose-950/20">
                          <div>
                            <p className="font-semibold text-slate-200">{st.name}</p>
                            <p className="text-[10px] text-slate-500">{st.villageName}</p>
                          </div>
                          <span className="text-rose-400 font-bold text-sm">{st.avgPercentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Log snapshot */}
              <div className="glass-panel p-6 rounded-2xl">
                <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                  <span className="mr-2">📝</span> Recent Activity Logs
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Details</th>
                        <th className="py-2.5 px-3 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {stats.recentLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-900/30">
                          <td className="py-3 px-3 font-semibold text-slate-300">{log.userId?.name || 'System'}</td>
                          <td className="py-3 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.userId?.role === 'Admin' ? 'bg-indigo-950 text-indigo-400' :
                              log.userId?.role === 'Teacher' ? 'bg-purple-950 text-purple-400' : 'bg-emerald-950 text-emerald-400'
                            }`}>
                              {log.userId?.role || 'SYSTEM'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-indigo-300 font-medium">{log.action}</td>
                          <td className="py-3 px-3 text-slate-400">{log.details}</td>
                          <td className="py-3 px-3 text-right text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* active tab: Villages CRUD */}
      {tab === 'villages' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center"><span className="mr-2">🗺️</span> {t('villages')}</h3>
            <button
              onClick={() => startCreate('village')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 transition"
            >
              <Plus size={16} /> <span>{t('add')}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {villages.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-900/20">
                    <td className="py-4 px-4 font-mono text-indigo-400 font-semibold">{v.code}</td>
                    <td className="py-4 px-4 font-semibold text-slate-200">{v.name}</td>
                    <td className="py-4 px-4 text-slate-400">{v.district}</td>
                    <td className="py-4 px-4 text-slate-400">{v.state}</td>
                    <td className="py-4 px-4 text-right flex justify-end space-x-2">
                      <button
                        onClick={() => startEdit(v, 'village')}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-lg transition"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(v._id, 'village')}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* active tab: Classes CRUD */}
      {tab === 'classes' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📚</span> {t('classes')}</h3>
            <button
              onClick={() => startCreate('class')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 transition"
            >
              <Plus size={16} /> <span>{t('add')}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {classes.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/20">
                    <td className="py-4 px-4 font-mono text-indigo-400 font-semibold">{c.code}</td>
                    <td className="py-4 px-4 font-semibold text-slate-200">{c.name}</td>
                    <td className="py-4 px-4 text-right flex justify-end space-x-2">
                      <button
                        onClick={() => startEdit(c, 'class')}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-lg transition"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(c._id, 'class')}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* active tab: Teachers CRUD */}
      {tab === 'teachers' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center"><span className="mr-2">👨‍🏫</span> {t('teachers')}</h3>
            <button
              onClick={() => startCreate('teacher')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 transition"
            >
              <Plus size={16} /> <span>{t('add')}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Assigned Villages</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {teachers.map((tItem) => (
                  <tr key={tItem.user._id} className="hover:bg-slate-900/20">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-200">{tItem.user.name}</p>
                      <p className="text-xs text-slate-500">{tItem.user.email} | {tItem.user.phone || 'No Phone'}</p>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs">{tItem.user.username}</td>
                    <td className="py-4 px-4 text-slate-300">{tItem.profile?.specialization || '-'}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {tItem.profile?.villageIds?.map(v => (
                          <span key={v._id} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 font-semibold">
                            {v.name}
                          </span>
                        ))}
                        {(!tItem.profile?.villageIds || tItem.profile.villageIds.length === 0) && <span className="text-slate-600 text-xs">Unassigned</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tItem.user.status === 'Active' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                        {tItem.user.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right flex justify-end space-x-2">
                      <button
                        onClick={() => startEdit(tItem, 'teacher')}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-lg transition"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(tItem.user._id, 'teacher')}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* active tab: Students CRUD */}
      {tab === 'students' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center"><span className="mr-2">🎓</span> {t('students')}</h3>
            <button
              onClick={() => startCreate('student')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 transition"
            >
              <Plus size={16} /> <span>{t('add')}</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Village</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Guardian</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {students
                  .filter(st => st.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((st) => (
                    <tr key={st.user._id} className="hover:bg-slate-900/20">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-400 text-xs">{st.profile?.rollNumber || '-'}</td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-200">{st.user.name}</p>
                        <p className="text-[10px] text-slate-500">@{st.user.username} | {st.user.phone || 'No Phone'}</p>
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-medium">{st.profile?.villageId?.name || 'Unassigned'}</td>
                      <td className="py-4 px-4 text-slate-300 font-medium">{st.profile?.classId?.name || 'Unassigned'}</td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        <p>{st.profile?.guardianName || '-'}</p>
                        <p className="text-[10px] text-slate-500">{st.profile?.guardianPhone}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${st.user.status === 'Active' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                          {st.user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right flex justify-end space-x-2">
                        <button
                          onClick={() => startEdit(st, 'student')}
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-lg transition"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(st.user._id, 'student')}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* active tab: Audit Logs */}
      {tab === 'auditLogs' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="text-xl font-bold flex items-center"><span className="mr-2">📝</span> System Audit Trail</h3>
          <div className="max-h-[60vh] overflow-y-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/30">
                    <td className="py-3 px-4 font-semibold text-slate-300">{log.userId?.name || 'System'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.userId?.role === 'Admin' ? 'bg-indigo-950 text-indigo-400' :
                        log.userId?.role === 'Teacher' ? 'bg-purple-950 text-purple-400' : 'bg-emerald-950 text-emerald-400'
                      }`}>
                        {log.userId?.role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-indigo-300 font-semibold">{log.action}</td>
                    <td className="py-3 px-4 text-slate-400">{log.details}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{log.ipAddress}</td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* active tab: Settings */}
      {tab === 'settings' && (
        <Settings />
      )}

      {/* POPUP FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
                {editId ? t('edit') : t('add')} {modalType}
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-100 text-lg">×</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {modalType === 'village' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Village Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Village Code *</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">District</label>
                      <input
                        type="text"
                        value={formData.district || ''}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'class' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Class/Standard Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Class Code *</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      required
                    />
                  </div>
                </>
              )}

              {modalType === 'teacher' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Username *</label>
                      <input
                        type="text"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        disabled={!!editId}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 disabled:opacity-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Password {editId ? '(Leave blank to keep)' : '*'}
                      </label>
                      <input
                        type="password"
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                        required={!editId}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Specialization</label>
                      <input
                        type="text"
                        value={formData.specialization || ''}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                      <select
                        value={formData.status || 'Active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Assign Villages</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-36 overflow-y-auto">
                      {villages.map((v) => (
                        <label key={v._id} className="flex items-center space-x-2 text-xs text-slate-300 hover:text-slate-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(formData.villageIds || []).includes(v._id)}
                            onChange={() => handleTeacherVillageToggle(v._id)}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                          />
                          <span>{v.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {modalType === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Username *</label>
                      <input
                        type="text"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        disabled={!!editId}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 disabled:opacity-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Password {editId ? '(Leave blank to keep)' : '*'}
                      </label>
                      <input
                        type="password"
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                        required={!editId}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={formData.rollNumber || ''}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Class *</label>
                      <select
                        value={formData.classId || ''}
                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select</option>
                        {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Village *</label>
                      <select
                        value={formData.villageId || ''}
                        onChange={(e) => setFormData({ ...formData, villageId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select</option>
                        {villages.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Guardian Name</label>
                      <input
                        type="text"
                        value={formData.guardianName || ''}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Guardian Phone</label>
                      <input
                        type="text"
                        value={formData.guardianPhone || ''}
                        onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                    <select
                      value={formData.status || 'Active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-md"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
