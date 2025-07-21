import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthForm } from './components/Auth/AuthForm';
import { Navbar } from './components/Layout/Navbar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { JobsList } from './components/Jobs/JobsList';
import { ResumeManager } from './components/Resume/ResumeManager';
import { AdminPanel } from './components/Admin/AdminPanel';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageData, setPageData] = useState<any>(null);

  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page);
    setPageData(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-lg opacity-50" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">JobAI</h2>
          <p className="text-gray-600 dark:text-gray-400">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'jobs':
        return <JobsList initialData={pageData} />;
      case 'resume':
        return <ResumeManager />;
      case 'admin':
        return user.role === 'admin' ? <AdminPanel /> : <Dashboard onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="transition-all duration-200">
        {renderPage()}
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;