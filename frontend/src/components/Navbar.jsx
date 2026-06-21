import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSelector } from 'react-redux';
import { Globe, User, Settings, LogOut, Sun, Moon, Bell, BellOff } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';
import { unsubscribeFromPushNotifications } from '../utils/pushNotifications';
import axios from 'axios';

const Navbar = ({ title, setTab, currentTab }) => {
  const { toggleLanguage, lang, t } = useLanguage();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  // Unread messages count for bell badge
  const [unreadCount, setUnreadCount] = useState(0);
  // Notification permission status
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  // Fetch unread count for students
  useEffect(() => {
    if (user?.role === 'Student' && user?.token) {
      const fetchUnreadCount = async () => {
        try {
          const res = await axios.get('/api/messages', {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const unread = res.data.filter(m => !m.isRead).length;
          setUnreadCount(unread);
        } catch (err) {
          // Silently fail
        }
      };
      fetchUnreadCount();
      // Poll every 30s
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.token, currentTab]); // Re-fetch when tab changes

  // Check notification permission status
  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleLogout = async () => {
    // Unsubscribe push notifications on logout
    if (user?.token) {
      await unsubscribeFromPushNotifications(user.token).catch(() => {});
    }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="glass-panel border-b border-slate-800 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <img
          src="/logo.png"
          alt="Navoday"
          className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-lg shadow-md border border-slate-700 no-invert"
          onError={(e) => { e.target.outerHTML = '<div class="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xl">🎓</div>'; }}
        />
        <h2 className="text-base sm:text-xl font-bold text-slate-100 truncate">
          {user?.role === 'Student' ? user.name : title}
        </h2>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold px-2 sm:px-3 py-1.5 rounded-lg border border-slate-700 transition duration-150 text-xs sm:text-sm"
        >
          <Globe size={14} />
          <span className="hidden sm:inline">{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
          <span className="sm:hidden">{lang === 'en' ? 'GU' : 'EN'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsLightMode(!isLightMode)}
          className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700 transition duration-150 shadow-md no-invert"
          title="Toggle Theme"
        >
          {isLightMode ? <Moon size={18} className="text-slate-300" /> : <Sun size={18} />}
        </button>

        {/* Bell Icon - Messages shortcut for Students */}
        {user?.role === 'Student' && (
          <button
            onClick={() => setTab && setTab('messages')}
            className="relative p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 rounded-lg border border-slate-700 transition duration-150"
            title="Messages"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Notification permission indicator (only for students with denied permission) */}
        {user?.role === 'Student' && notifPermission === 'denied' && (
          <span
            title="Notifications blocked! Browser settings ખોલો"
            className="p-1.5 text-amber-400 hover:text-amber-300"
          >
            <BellOff size={16} />
          </span>
        )}

        {/* Quick Actions (Settings & Logout) */}
        {user && (
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => { if(setTab) setTab('settings') }}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition"
              title={t('settings')}
            >
              <Settings size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title={t('logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}

        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-800/40 border border-slate-800 px-2 sm:px-4 py-1.5 rounded-xl">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600/30 flex items-center justify-center border border-indigo-500/50 shrink-0">
              <User size={14} className="text-indigo-400" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-100">{user.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none font-bold">
                {t(user.role.toLowerCase())}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
