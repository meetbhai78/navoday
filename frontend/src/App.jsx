import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Subpages / views
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

// Route Guards
const ProtectedLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Inject active tab views dynamically
  const renderTabContent = () => {
    switch (user.role) {
      case 'Admin':
        return <AdminDashboard tab={currentTab} setTab={setCurrentTab} />;
      case 'Teacher':
        return <TeacherDashboard tab={currentTab} setTab={setCurrentTab} />;
      case 'Student':
        return <StudentDashboard tab={currentTab} setTab={setCurrentTab} />;
      default:
        return <div className="p-8 text-center text-rose-400">Unauthorized role</div>;
    }
  };

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100">
      <Sidebar role={user.role} currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar title={user.role + " Portal"} />
        <main className="flex-grow p-8 max-w-7xl mx-auto w-full transition-all duration-300">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
