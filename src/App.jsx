import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Notification from './components/Notification';
import ApiConfigModal from './components/ApiConfigModal';
import SubmitReport from './pages/SubmitReport';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProfileModal from './components/ProfileModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  submitWorkReport, 
  fetchWorkReports, 
  getScriptUrl 
} from './services/googleSheetsService';
import { Building2, Loader2 } from 'lucide-react';
import './styles/global.css';
import './styles/form.css';
import './styles/dashboard.css';
import './styles/components.css';

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'dashboard'
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dataSource, setDataSource] = useState('local_storage');
  const [sheetName, setSheetName] = useState('Work_Reports');

  // Toast Notification Dispatcher
  const showNotification = useCallback((type, title, message, duration = 5000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch reports from backend or local storage
  const loadReports = useCallback(async (showToastNotice = false) => {
    setIsLoading(true);
    try {
      const result = await fetchWorkReports();
      setReports(result.reports || []);
      setDataSource(result.source || 'local_storage');
      if (result.sheetName) {
        setSheetName(result.sheetName);
      }

      if (showToastNotice) {
        if (result.source === 'google_sheets') {
          showNotification(
            'success',
            'Synchronized with Google Sheets',
            `Successfully retrieved ${result.count} report(s) from "${result.sheetName || 'Work_Reports'}".`
          );
        } else {
          showNotification(
            'info',
            'Local Storage Loaded',
            `Loaded ${result.count} report(s) from browser local storage.`
          );
        }
      }
    } catch (err) {
      console.error('Failed to load work reports:', err);
      showNotification('error', 'Sync Warning', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Initial load when user is authenticated
  useEffect(() => {
    if (user) {
      loadReports(false);
    }
  }, [user, loadReports]);

  // Form submission handler
  const handleFormSubmit = async (formData) => {
    if (isSubmitting) return false;

    setIsSubmitting(true);
    try {
      const response = await submitWorkReport(formData);

      if (response && response.success) {
        showNotification(
          'success',
          'Report Submitted Successfully!',
          response.message || 'Work details have been logged and recorded.',
          6000
        );

        // Refresh reports list
        await loadReports(false);

        // Switch to dashboard view so user immediately sees their record in the table
        setTimeout(() => {
          setActiveTab('dashboard');
        }, 800);

        return true;
      } else {
        throw new Error(response.error || 'Submission was not completed.');
      }
    } catch (err) {
      showNotification(
        'error',
        'Submission Error',
        err.message || 'An error occurred while submitting the work report. Please try again.',
        7000
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading authentication session
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#071322',
        color: '#ffffff',
        gap: '1rem',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}>
        <div style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)'
        }}>
          <Building2 size={28} color="#ffffff" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#93c5fd' }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Authenticating session...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated user: Show Login Page
  if (!user) {
    return <Login />;
  }

  // 3. Authenticated user: Show Main Enterprise Dashboard & Forms
  const isOnlineWithSheets = Boolean(getScriptUrl() && dataSource === 'google_sheets');

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <Notification toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Navigation Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reportCount={reports.length}
        isOnlineWithSheets={isOnlineWithSheets}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        reports={reports}
      />

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reportCount={reports.length}
        isOnlineWithSheets={isOnlineWithSheets}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'submit' ? (
          <SubmitReport 
            onSubmit={handleFormSubmit} 
            isSubmitting={isSubmitting} 
          />
        ) : (
          <Dashboard
            reports={reports}
            onRefreshData={() => loadReports(true)}
            isLoading={isLoading}
            showNotification={showNotification}
            dataSource={dataSource}
            sheetName={sheetName}
          />
        )}
      </main>

      {/* Integration & Settings Modal */}
      <ApiConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigSaved={() => loadReports(true)}
        onRefreshData={() => loadReports(true)}
        showNotification={showNotification}
      />

      {/* Employee ID & Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        showNotification={showNotification}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
