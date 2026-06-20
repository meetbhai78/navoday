import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, registerStudent, reset } from '../features/authSlice';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Eye, EyeOff, Globe } from 'lucide-react';

const Login = () => {
  const { t, toggleLanguage, lang } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register credentials
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRollNumber, setRegRollNumber] = useState('');
  const [regClassId, setRegClassId] = useState('');
  const [regVillageId, setRegVillageId] = useState('');
  const [regGuardianName, setRegGuardianName] = useState('');
  const [regGuardianPhone, setRegGuardianPhone] = useState('');

  // Villages & Classes lists
  const [villages, setVillages] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    // Fetch villages & classes for registration
    const fetchMeta = async () => {
      try {
        const vRes = await axios.get('/api/auth/villages');
        const cRes = await axios.get('/api/auth/classes');
        setVillages(vRes.data);
        setClasses(cRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    if (isError) {
      alert(message);
      dispatch(reset());
    }

    if (isSuccess || user) {
      navigate('/');
      dispatch(reset());
    }
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return alert('Fill in all fields');
    dispatch(login({ username, password }));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (
      !regUsername ||
      !regPassword ||
      !regName ||
      !regClassId ||
      !regVillageId
    ) {
      return alert('Fill in all required fields');
    }

    dispatch(
      registerStudent({
        username: regUsername,
        password: regPassword,
        name: regName,
        email: regEmail,
        phone: regPhone,
        rollNumber: regRollNumber,
        classId: regClassId,
        villageId: regVillageId,
        guardianName: regGuardianName,
        guardianPhone: regGuardianPhone
      })
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none"></div>

      {/* Language Switch Button */}
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 font-semibold px-4 py-2 rounded-xl border border-slate-800 transition duration-150 text-sm shadow-md"
      >
        <Globe size={16} />
        <span>{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
      </button>

      <div className="w-full max-w-xl glass-panel glow-indigo rounded-3xl p-8 md:p-10 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🎓</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300">
            {t('appName')}
          </h2>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            {isRegister ? t('register') : t('login')}
          </p>
        </div>

        {!isRegister ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {t('username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition duration-150"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-4 pr-12 py-3 text-slate-100 placeholder-slate-500 outline-none transition duration-150"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : t('login')}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition"
              >
                {t('register')}
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('name')} *
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Enter full name"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('username')} *
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('password')} *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('phone')}
                </label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('rollNumber')}
                </label>
                <input
                  type="text"
                  value={regRollNumber}
                  onChange={(e) => setRegRollNumber(e.target.value)}
                  placeholder="Roll No"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('class')} *
                </label>
                <select
                  value={regClassId}
                  onChange={(e) => setRegClassId(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">Select</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('village')} *
                </label>
                <select
                  value={regVillageId}
                  onChange={(e) => setRegVillageId(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">Select</option>
                  {villages.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('guardianName')}
                </label>
                <input
                  type="text"
                  value={regGuardianName}
                  onChange={(e) => setRegGuardianName(e.target.value)}
                  placeholder="Guardian full name"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('guardianPhone')}
                </label>
                <input
                  type="text"
                  value={regGuardianPhone}
                  onChange={(e) => setRegGuardianPhone(e.target.value)}
                  placeholder="Guardian Phone"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Creating...' : t('register')}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold transition"
              >
                Already registered? {t('login')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
