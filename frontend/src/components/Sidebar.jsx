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
  FolderOpen,
  Settings
} from 'lucide-react';

const Sidebar = ({ role, currentTab, setCurrentTab }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const adminTabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'villages', label: t('villages'), icon: MapPin },
    { id: 'classes', label: t('classes'), icon: BookOpen },
    { id: 'teachers', label: t('teachers'), icon: Users },
    { id: 'students', label: t('students'), icon: GraduationCap },
    { id: 'auditLogs', label: t('auditLogs'), icon: FileCode },
    { id: 'settings', label: t('settings'), icon: Settings }
  ];

  const teacherTabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'attendance', label: t('attendance'), icon: CalendarCheck },
    { id: 'exams', label: t('exams'), icon: FileSpreadsheet },
    { id: 'homework', label: t('homework'), icon: FolderOpen },
    { id: 'messages', label: t('messages'), icon: Mail },
    { id: 'settings', label: t('settings'), icon: Settings }
  ];

  const studentTabs = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'attendance', label: t('attendance'), icon: CalendarCheck },
    { id: 'exams', label: t('exams'), icon: FileSpreadsheet },
    { id: 'homework', label: t('homework'), icon: FolderOpen },
    { id: 'messages', label: t('messages'), icon: Mail },
    { id: 'settings', label: t('settings'), icon: Settings }
  ];

  const tabs = role === 'Admin' ? adminTabs : role === 'Teacher' ? teacherTabs : studentTabs;

  return (
    <>
      {/* --- DESKTOP SIDEBAR (Hidden on mobile) --- */}
      <aside className="hidden md:flex flex-col w-64 h-full border-r border-slate-800 glass-panel z-10 sticky top-0">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <span className="text-3xl">🎓</span>
          <div>
            <h1 className="font-bold text-lg text-indigo-400 tracking-wide">Navoday</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{role}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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

      {/* --- MOBILE BOTTOM NAVIGATION BAR (Hidden on desktop) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 flex items-center overflow-x-auto no-scrollbar z-50 px-2 py-2 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[60px] rounded-xl transition-all duration-200 ${
                isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-lg mb-0.5 transition-all ${isActive ? 'bg-indigo-600/20 shadow-inner' : ''}`}>
                <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
              </div>
              <span className={`text-[9px] font-semibold tracking-wide ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
        
        {/* Logout Button in Mobile Bottom Nav */}
        <div className="w-[1px] h-8 bg-slate-800 mx-1 flex-shrink-0"></div>
        <button
          onClick={handleLogout}
          className="flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[60px] rounded-xl text-rose-500 hover:text-rose-400 transition-all"
        >
          <div className="p-1.5 rounded-lg mb-0.5">
            <LogOut size={20} />
          </div>
          <span className="text-[9px] font-semibold tracking-wide text-rose-500/80">{t('logout')}</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
