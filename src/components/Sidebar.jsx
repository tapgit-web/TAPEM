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
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import { exportToXLSX } from '../utils/exportToExcel';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab, 
  reportCount = 0, 
  isOnlineWithSheets = false, 
  onOpenConfig, 
  reports = [] 
}) {
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
