import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ClipboardEdit, 
  LayoutDashboard, 
  CloudCheck, 
  CloudOff, 
  Clock, 
  Settings2, 
  Menu 
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  reportCount = 0, 
  isOnlineWithSheets = false, 
  onOpenConfig,
  onToggleSidebar 
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) + ' ' +
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand Section & Sidebar Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onToggleSidebar}
            style={{ color: '#ffffff', padding: '0.4rem', border: '1px solid rgba(255, 255, 255, 0.2)' }}
            title="Toggle Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>

          <div className="brand-section">
            <div className="brand-logo-icon">
              <Building2 size={24} />
            </div>
            <div className="brand-text">
              <span className="brand-company-name">Apex Industrial Technologies</span>
              <h1 className="brand-app-title">WorkLog Enterprise</h1>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="header-nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => setActiveTab('submit')}
          >
            <ClipboardEdit size={18} />
            <span>Submit Report</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Reports Dashboard</span>
            {reportCount > 0 && (
              <span className="nav-tab-badge">{reportCount}</span>
            )}
          </button>
        </nav>

        {/* Header Utilities */}
        <div className="header-utilities">
          {/* Live Clock */}
          <div className="live-clock-badge" title="Local System Time">
            <Clock size={14} />
            <span>{currentTime || 'Loading...'}</span>
          </div>

          {/* Google Sheets Connection Pill */}
          <button
            type="button"
            className={`api-status-pill ${isOnlineWithSheets ? 'connected' : 'local-mode'}`}
            onClick={onOpenConfig}
            title={
              isOnlineWithSheets 
                ? 'Connected to Google Sheets Web App. Click to view configuration.' 
                : 'Running in Local Persistence Mode. Click to link Google Sheet.'
            }
          >
            {isOnlineWithSheets ? (
              <>
                <CloudCheck size={15} />
                <span>Google Sheets Sync</span>
              </>
            ) : (
              <>
                <CloudOff size={15} />
                <span>Local Storage Mode</span>
              </>
            )}
          </button>

          {/* Quick Settings Icon */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: '#ffffff', padding: '0.4rem' }}
            onClick={onOpenConfig}
            title="Configure Google Apps Script & Google Forms"
            aria-label="Settings"
          >
            <Settings2 size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
