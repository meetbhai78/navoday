import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSelector } from 'react-redux';
import { Globe, User } from 'lucide-react';

const Navbar = ({ title }) => {
  const { toggleLanguage, lang, t } = useLanguage();
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="glass-panel border-b border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h2 className="text-xl font-bold text-slate-100">{title}</h2>
      </div>

      <div className="flex items-center space-x-6">
        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition duration-150 text-sm"
        >
          <Globe size={16} />
          <span>{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
        </button>

        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-3 bg-slate-800/40 border border-slate-800 px-4 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center border border-indigo-500/50">
              <User size={16} className="text-indigo-400" />
            </div>
            <div>
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
