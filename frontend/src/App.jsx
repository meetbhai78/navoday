import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { setupPushNotifications, unsubscribeFromPushNotifications } from './utils/pushNotifications';

// Subpages / views
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

// Route Guards
const ProtectedLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  
  // Read initial tab from URL query param (e.g. /?tab=messages from notification click)
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ====== PUSH NOTIFICATION SETUP ======
  // After login, register Service Worker & request permission for Students
  useEffect(() => {
    if (user && user.token && user.role === 'Student') {
      // Small delay to not block login animation
      const timer = setTimeout(() => {
        setupPushNotifications(user.token).catch(console.error);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user?.token]);

  // Listen for URL changes (notification clicks navigate to /?tab=xxx)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl) {
      setCurrentTab(tabFromUrl);
    }
  }, [location.search]);

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
      <Sidebar
        role={user.role}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden w-0">
        <Navbar
          title={user.role + " Portal"}
          setTab={setCurrentTab}
          currentTab={currentTab}
        />
        <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full transition-all duration-300">
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
