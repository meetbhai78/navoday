import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  GraduationCap,
  Mail,
  FileCode,
  LogOut,
  FolderOpen
} from 'lucide-react';

const Sidebar = ({ role, currentTab, setCurrentTab }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Define tabs per role
  const adminTabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'villages', label: t('villages'), icon: MapPin },
    { id: 'classes', label: t('classes'), icon: BookOpen },
    { id: 'teachers', label: t('teachers'), icon: Users },
    { id: 'students', label: t('students'), icon: GraduationCap },
    { id: 'auditLogs', label: t('auditLogs'), icon: FileCode }
  ];

  const teacherTabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'attendance', label: t('attendance'), icon: CalendarCheck },
    { id: 'exams', label: t('exams'), icon: FileSpreadsheet },
    { id: 'homework', label: t('homework'), icon: FolderOpen },
    { id: 'messages', label: t('messages'), icon: Mail }
  ];

  const studentTabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'attendance', label: t('attendance'), icon: CalendarCheck },
    { id: 'exams', label: t('exams'), icon: FileSpreadsheet },
    { id: 'homework', label: t('homework'), icon: FolderOpen },
    { id: 'messages', label: t('messages'), icon: Mail }
  ];

  const tabs = role === 'Admin' ? adminTabs : role === 'Teacher' ? teacherTabs : studentTabs;

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <span className="text-3xl">🎓</span>
        <div>
          <h1 className="font-bold text-lg text-indigo-400 tracking-wide">Navoday</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all duration-200"
        >
          <LogOut size={18} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
