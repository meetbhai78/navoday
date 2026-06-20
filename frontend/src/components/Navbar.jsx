import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSelector } from 'react-redux';
import { Globe, User, Settings, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ title, setTab }) => {
  const { toggleLanguage, lang, t } = useLanguage();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="glass-panel border-b border-slate-800 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">

        <h2 className="text-base sm:text-xl font-bold text-slate-100 truncate">
          {user?.role === 'Student' ? user.name : title}
        </h2>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-6">
        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold px-2 sm:px-3 py-1.5 rounded-lg border border-slate-700 transition duration-150 text-xs sm:text-sm"
        >
          <Globe size={14} />
          <span className="hidden sm:inline">{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
          <span className="sm:hidden">{lang === 'en' ? 'GU' : 'EN'}</span>
        </button>

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
