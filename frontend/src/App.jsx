import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { RegisterFace } from './components/RegisterFace';
import { AttendancePage } from './components/AttendancePage';
import { AdminPanel } from './components/AdminPanel';
import { SettingsPage } from './components/SettingsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminRegisterFace } from './components/AdminRegisterFace';
import { AdminUserManagement } from './components/AdminUserManagement';
import { AdminAttendanceRecords } from './components/AdminAttendanceRecords';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // On app load, verify token and fetch profile if token exists
    const token = localStorage.getItem('authToken');
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    import('./api')
      .then(({ apiFetch }) => apiFetch('/api/auth/verify-token'))
      .then((data) => {
        if (data && data.valid) {
          setCurrentUser({ id: data.user_id, name: data.name, role: data.role });
          setCurrentPage('dashboard');
        } else {
          localStorage.removeItem('authToken');
        }
      })
      .catch(() => {
        localStorage.removeItem('authToken');
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  const handleGetStarted = () => {
    setCurrentPage('login');
  };

  const renderPage = () => {
    if (currentPage === 'landing') {
      return <LandingPage onGetStarted={handleGetStarted} />;
    }

    if (checkingAuth) {
      return <div className="min-h-screen flex items-center justify-center">Checking authentication...</div>;
    }

    if (currentPage === 'login' || !currentUser) {
      return <LoginPage onLogin={handleLogin} onBack={() => setCurrentPage('landing')} />;
    }

    // Admin gets different pages
    if (currentUser.role === 'admin') {
      switch (currentPage) {
        case 'dashboard':
          return <AdminDashboard user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
        case 'attendance-records':
          return <AdminAttendanceRecords user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
        case 'register-face':
          return <AdminRegisterFace user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
        case 'admin':
          return <AdminUserManagement user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
        case 'settings':
          return <SettingsPage user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
        default:
          return <AdminDashboard user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      }
    }

    // Regular users get standard pages
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case 'register-face':
        return <RegisterFace user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case 'attendance':
        return <AttendancePage user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case 'settings':
        return <SettingsPage user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
      default:
        return <Dashboard user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />;
    }
  };

  return <div className="min-h-screen bg-gray-50">{renderPage()}</div>;
}


