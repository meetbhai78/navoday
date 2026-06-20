import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { t } = useLanguage();
  const { user } = useSelector((state) => state.auth);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!currentPassword || !newPassword) {
      return setError('Please fill in both password fields');
    }

    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      await axios.put('/api/auth/password', { currentPassword, newPassword }, config);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error updating password');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto glass-panel p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 animate-scale-up">
      <div className="text-center">
        <span className="text-4xl block mb-2">🔒</span>
        <h3 className="text-xl font-bold text-slate-100">{t('settings')}</h3>
        <p className="text-xs text-slate-400 mt-1">Change your portal access password securely.</p>
      </div>

      {success && (
        <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs">
          <CheckCircle size={16} />
          <span>{t('passwordChanged')}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/60 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">{t('currentPassword')}</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-200 outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">{t('newPassword')}</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-200 outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-md"
        >
          {loading ? 'Processing...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
