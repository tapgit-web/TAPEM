import React from 'react';
import { 
  Building2, 
  ClipboardEdit, 
  LayoutDashboard, 
  CloudCheck, 
  CloudOff, 
  FileSpreadsheet, 
  Settings2, 
  X, 
  LogOut,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { exportToXLSX } from '../utils/exportToExcel';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab, 
  reportCount = 0, 
  isOnlineWithSheets = false, 
  onOpenConfig, 
  onOpenProfile,
  reports = [] 
}) {
  const { user, logout } = useAuth();
  const handleNav = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleQuickExport = () => {
    if (reports.length === 0) {
      alert('No reports available to export.');
      return;
    }
    exportToXLSX(reports, 'Employee_Work_Reports', false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose} 
          aria-hidden="true" 
        />
      )}

      {/* Sidebar Aside */}
      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`} aria-label="Main Navigation Sidebar">
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="brand-section">
            <div className="brand-logo-icon" style={{ width: 34, height: 34 }}>
              <Building2 size={18} />
            </div>
            <div className="brand-text">
              <span className="brand-company-name" style={{ fontSize: '0.65rem' }}>Apex Industrial</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>WorkLog</span>
            </div>
          </div>

          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Menu */}
        <div className="sidebar-body">
          <div className="sidebar-section-title">Navigation</div>
          
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'submit' ? 'active' : ''}`}
              onClick={() => handleNav('submit')}
            >
              <ClipboardEdit size={18} />
              <span>Submit Report</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNav('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Reports Dashboard</span>
              {reportCount > 0 && (
                <span className="sidebar-badge">{reportCount}</span>
              )}
            </button>
          </nav>

          <div className="sidebar-section-title" style={{ marginTop: '1.5rem' }}>Cloud Integration</div>
          <div className="sidebar-nav">
            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() => {
                onOpenConfig();
                if (window.innerWidth < 1024) onClose();
              }}
            >
              {isOnlineWithSheets ? (
                <>
                  <CloudCheck size={18} style={{ color: '#34d399' }} />
                  <span>Google Sheets (Connected)</span>
                </>
              ) : (
                <>
                  <CloudOff size={18} style={{ color: '#fbbf24' }} />
                  <span>Google Sheets (Offline)</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() => {
                onOpenConfig();
                if (window.innerWidth < 1024) onClose();
              }}
            >
              <Settings2 size={18} />
              <span>Settings & Sync</span>
            </button>
          </div>

          {/* Quick Actions Card */}
          <div className="sidebar-card">
            <div className="sidebar-card-title">Quick Export</div>
            <p className="sidebar-card-desc">
              Download complete logs formatted for Microsoft Excel with UTF-8 support.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.65rem' }}
              onClick={handleQuickExport}
              disabled={reports.length === 0}
            >
              <FileSpreadsheet size={15} style={{ color: '#107c41' }} />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {user && (
            <div style={{ 
              marginBottom: '0.85rem', 
              padding: '0.65rem', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', cursor: 'pointer', flex: 1 }}
                onClick={() => {
                  if (onOpenProfile) onOpenProfile();
                  if (window.innerWidth < 1024) onClose();
                }}
                title="Click to change Employee ID & Profile"
              >
                <div style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: '50%', 
                  background: '#0284c7', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.displayName}
                  </span>
                  <span style={{ fontSize: '0.675rem', color: '#93c5fd', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span>{user.employeeId || 'Set ID'}</span>
                    <span style={{ fontSize: '0.6rem', color: '#38bdf8', textDecoration: 'underline' }}>(edit)</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
            WorkLog Pro Enterprise v1.0
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
            © 2026 Apex Industrial Technologies
          </div>
        </div>
      </aside>
    </>
  );
}
