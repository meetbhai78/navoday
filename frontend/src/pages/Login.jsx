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
  const [regSurname, setRegSurname] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regFatherName, setRegFatherName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRollNumber, setRegRollNumber] = useState('');
  const [regClassId, setRegClassId] = useState('');
  const [regVillageId, setRegVillageId] = useState('');

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
      !regPhone ||
      !regPassword ||
      !regSurname ||
      !regFirstName ||
      !regFatherName ||
      !regClassId ||
      !regVillageId
    ) {
      return alert('Fill in all required fields (including Phone Number)');
    }

    const fullName = `${regSurname} ${regFirstName} ${regFatherName}`.trim();

    dispatch(
      registerStudent({
        password: regPassword,
        name: fullName,
        email: regEmail,
        phone: regPhone,
        rollNumber: regRollNumber,
        classId: regClassId,
        villageId: regVillageId
      })
    );
  };

  const inputClass = "w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150";
  const labelClass = "block text-xs font-semibold text-slate-300 mb-1";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[20rem] sm:w-[40rem] h-[20rem] sm:h-[40rem] rounded-full bg-indigo-900/10 blur-[80px] sm:blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[20rem] sm:w-[40rem] h-[20rem] sm:h-[40rem] rounded-full bg-emerald-900/10 blur-[80px] sm:blur-[120px] pointer-events-none z-0"></div>

      {/* Left side: AI Background Image */}
      <div className="hidden md:block md:w-1/2 relative bg-slate-900 overflow-hidden shadow-2xl z-10 border-r border-slate-800">
        <img 
          src="/login-bg.png" 
          alt="Navoday Education" 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12 bg-slate-950/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/50">
          <h1 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg">Welcome to Navoday</h1>
          <p className="text-slate-300 text-sm drop-shadow-md leading-relaxed">Empowering rural education with modern tools, inspiring the next generation of bright minds.</p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-12 z-10 relative">
        {/* Mobile Header Image */}
        <div className="absolute top-0 left-0 right-0 h-48 md:hidden -z-10">
          <img 
            src="/login-bg.png" 
            alt="Navoday Education" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950"></div>
        </div>

        {/* Language Switch Button */}
        <button
          onClick={toggleLanguage}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center space-x-1.5 sm:space-x-2 bg-slate-900/80 hover:bg-slate-800 text-indigo-300 font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-800 transition duration-150 text-xs sm:text-sm shadow-md backdrop-blur-sm z-20"
        >
          <Globe size={14} />
          <span>{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
        </button>

        <div className="w-full max-w-md glass-panel glow-indigo rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl mt-12 md:mt-0 relative z-10 bg-slate-950/90 md:bg-slate-900/60">
          <div className="text-center mb-6 sm:mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="Navoday Logo" className="h-20 w-20 mb-4 object-contain rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-slate-700 no-invert" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 tracking-tight">
              Navoday
            </h2>
            <p className="text-slate-400 mt-2 text-xs sm:text-sm font-medium uppercase tracking-widest">
              {isRegister ? t('register') : t('login')}
            </p>
          </div>

        {!isRegister ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5 sm:mb-2">
                Mobile Number
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter mobile number"
                className="w-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition duration-150"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5 sm:mb-2">
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 sm:py-3.5 px-4 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : t('login')}
            </button>

            <div className="text-center pt-1 sm:pt-2">
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
          <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto pr-1 sm:pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className={labelClass}>Surname (અટક) *</label>
                <input type="text" value={regSurname} onChange={(e) => setRegSurname(e.target.value)} placeholder="Surname" className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Name (નાम) *</label>
                <input type="text" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} placeholder="Name" className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Father's Name (પિતાનું નામ) *</label>
                <input type="text" value={regFatherName} onChange={(e) => setRegFatherName(e.target.value)} placeholder="Father Name" className={inputClass} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className={labelClass}>Mobile Number *</label>
                <input type="text" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="Phone number" className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>{t('password')} *</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Password" className={inputClass} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className={labelClass}>{t('email')}</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="email@domain.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('class')} *</label>
                <select value={regClassId} onChange={(e) => setRegClassId(e.target.value)} className={inputClass} required>
                  <option value="">Select</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('village')} *</label>
                <select value={regVillageId} onChange={(e) => setRegVillageId(e.target.value)} className={inputClass} required>
                  <option value="">Select</option>
                  {villages.map((v) => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1">
              <div>
                <label className={labelClass}>{t('rollNumber')}</label>
                <input type="text" value={regRollNumber} onChange={(e) => setRegRollNumber(e.target.value)} placeholder="Roll No" className={inputClass} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 sm:py-3.5 px-4 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Creating...' : t('register')}
            </button>

            <div className="text-center pt-1 sm:pt-2">
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
    </div>
  );
};

export default Login;
