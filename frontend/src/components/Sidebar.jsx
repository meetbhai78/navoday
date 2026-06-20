import React, { useState } from 'react';
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
  Settings,
  X
} from 'lucide-react';

const Sidebar = ({ role, currentTab, setCurrentTab, isOpen, onClose }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleTabClick = (tabId) => {
    setCurrentTab(tabId);
    if (onClose) onClose(); // Close sidebar on mobile after selecting
  };

  // Define tabs per role
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
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 glass-panel border-r border-slate-800 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-auto
        `}
      >
        {/* Brand + Close button for mobile */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl sm:text-3xl">🎓</span>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-indigo-400 tracking-wide">Navoday</h1>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-semibold">{role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
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
        <div className="p-3 sm:p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
