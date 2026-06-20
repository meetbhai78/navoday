import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSelector } from 'react-redux';
import { Globe, User, Menu } from 'lucide-react';

const Navbar = ({ title, onMenuClick }) => {
  const { toggleLanguage, lang, t } = useLanguage();
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="glass-panel border-b border-slate-800 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        {/* Hamburger menu for mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-base sm:text-xl font-bold text-slate-100 truncate">{title}</h2>
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
