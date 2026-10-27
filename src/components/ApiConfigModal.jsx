import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  CheckCircle2, 
  AlertTriangle, 
  Link2, 
  HelpCircle, 
  Database, 
  Trash2, 
  Sparkles, 
  Check, 
  FileCode,
  Copy,
  ExternalLink
} from 'lucide-react';
import { 
  getScriptUrl, 
  saveScriptUrl, 
  testScriptConnection, 
  validateAndSanitizeUrl,
  seedSampleIndustrialReports, 
  clearLocalReports 
} from '../services/googleSheetsService';

export default function ApiConfigModal({ 
  isOpen, 
  onClose, 
  onConfigSaved, 
  onRefreshData, 
  showNotification 
}) {
  const [urlInput, setUrlInput] = useState(() => getScriptUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState('script'); // 'script' | 'forms' | 'demo'
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // Real-time URL format check
  const urlCheck = urlInput.trim() ? validateAndSanitizeUrl(urlInput) : null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testScriptConnection(urlInput);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        ok: false,
        message: err.message || 'Connection test failed.',
        troubleshooting: [
          'Verify "Who has access" is set to "Anyone" in Apps Script.',
          'Verify the script permissions were authorized by running setupSheet.'
        ]
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveScriptUrl(urlInput);
    if (showNotification) {
      showNotification(
        'success',
        'Configuration Saved',
        urlInput ? 'Google Apps Script Web App URL updated successfully.' : 'Switched to local offline mode.'
      );
    }
    if (onConfigSaved) onConfigSaved();
    if (onRefreshData) onRefreshData();
    onClose();
  };

  const handleSeedData = () => {
    const samples = seedSampleIndustrialReports();
    if (showNotification) {
      showNotification('success', 'Sample Data Loaded', `Loaded ${samples.length} realistic industrial demo records.`);
    }
    if (onRefreshData) onRefreshData();
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to delete all locally cached work reports?')) {
      clearLocalReports();
      if (showNotification) {
        showNotification('info', 'Local Data Cleared', 'All locally stored submissions have been removed.');
      }
      if (onRefreshData) onRefreshData();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cloud size={20} style={{ color: '#38bdf8' }} />
            <div>
              <h3 className="modal-title">Cloud Integration & Google Sheets Setup</h3>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                Connect live to your Google Spreadsheet via Google Apps Script
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', padding: '0 1.5rem' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ 
              borderRadius: 0, 
              borderBottom: activeTab === 'script' ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: activeTab === 'script' ? 'var(--primary-navy)' : 'var(--text-muted)',
              fontWeight: 700
            }}
            onClick={() => setActiveTab('script')}
          >
            Google Apps Script Setup
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ 
              borderRadius: 0, 
              borderBottom: activeTab === 'troubleshoot' ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: activeTab === 'troubleshoot' ? 'var(--primary-navy)' : 'var(--text-muted)',
              fontWeight: 700
            }}
            onClick={() => setActiveTab('troubleshoot')}
          >
            Connection Checklist
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ 
              borderRadius: 0, 
              borderBottom: activeTab === 'demo' ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: activeTab === 'demo' ? 'var(--primary-navy)' : 'var(--text-muted)',
              fontWeight: 700
            }}
            onClick={() => setActiveTab('demo')}
          >
            Offline / Data Cache
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {activeTab === 'script' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label htmlFor="scriptUrlInput" className="form-label">
                  <span>Google Apps Script Web App URL</span>
                  <span className="field-hint">Must end in /exec</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="url"
                    id="scriptUrlInput"
                    className="form-input font-mono"
                    style={{ fontSize: '0.825rem' }}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setTestResult(null);
                    }}
                  />
                </div>

                {/* Instant URL Warning if user pasted spreadsheet URL or /dev */}
                {urlCheck && !urlCheck.valid && (
                  <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{urlCheck.error}</span>
                  </div>
                )}
              </div>

              {/* Test Button & Result */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleTestConnection}
                  disabled={testing || !urlInput.trim()}
                >
                  {testing ? (
                    <>
                      <div className="spinner spinner-dark" style={{ width: 14, height: 14 }} />
                      <span>Verifying Endpoint...</span>
                    </>
                  ) : (
                    <>
                      <Link2 size={15} />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Tests both live read and write connectivity to your Google Sheet.
                </span>
              </div>

              {/* Test Result Box */}
              {testResult && (
                <div 
                  style={{ 
                    padding: '0.9rem 1.1rem', 
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.825rem',
                    background: testResult.ok ? 'var(--status-completed-bg)' : 'var(--danger-bg)',
                    border: `1px solid ${testResult.ok ? 'var(--status-completed-border)' : 'var(--danger-border)'}`,
                    color: testResult.ok ? 'var(--status-completed-text)' : 'var(--danger-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    {testResult.ok ? (
                      <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                    ) : (
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {testResult.ok ? 'Connection Verified & Ready!' : 'Connection Unsuccessful'}
                      </div>
                      <div style={{ marginTop: '0.15rem' }}>{testResult.message}</div>
                    </div>
                  </div>

                  {testResult.troubleshooting && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.35rem', color: '#1e293b' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>How to resolve this in Google Apps Script:</div>
                      <ol style={{ paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.775rem' }}>
                        {testResult.troubleshooting.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Instructions */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileCode size={16} />
                  <span>Deployment Checklist (Takes 60 Seconds)</span>
                </div>
                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <li>Open your Google Sheet, click <strong>Extensions → Apps Script</strong>.</li>
                  <li>Paste the code from <code className="font-mono">google-apps-script/Code.gs</code>.</li>
                  <li>Click <strong>Deploy → Manage deployments</strong> (or <strong>New deployment</strong>).</li>
                  <li>Select type: <strong>Web app</strong>.</li>
                  <li>Set <strong>Execute as:</strong> "Me" and <strong>Who has access:</strong> "Anyone" *(Crucial!)*.</li>
                  <li>Copy the resulting Web App URL ending in <code className="font-mono">/exec</code> and paste it above.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'troubleshoot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <HelpCircle size={16} />
                  <span>The 3 Most Common Reasons Why Google Apps Script Fails to Connect</span>
                </h4>
                <p style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                  Google Apps Script requires specific deployment settings to allow web applications to communicate with it without Google Login popups.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '0.2rem' }}>
                    1. "Who has access" is set to "Only myself" instead of "Anyone"
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    When set to "Only myself", Google redirects the connection to an account login page which browsers block due to security.
                    <br />
                    <strong>Fix:</strong> In Apps Script, click <em>Deploy → Manage deployments → Edit (pencil icon)</em>, set <strong>Who has access: Anyone</strong>, select <strong>Version: New version</strong>, and click <strong>Deploy</strong>.
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '0.2rem' }}>
                    2. You copied the Spreadsheet URL or Editor URL instead of the Web App URL
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    A Google Spreadsheet URL starts with <code className="font-mono">docs.google.com/spreadsheets</code>.
                    An Apps Script Web App URL always starts with <code className="font-mono">https://script.google.com/macros/s/</code> and ends in <code className="font-mono">/exec</code>.
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '0.2rem' }}>
                    3. Script permissions were not authorized in Google Apps Script
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    If you haven't clicked "Review permissions" and "Allow" inside the Apps Script editor, Google blocks all executions.
                    <br />
                    <strong>Fix:</strong> In the Apps Script toolbar, choose function <code className="font-mono">setupSheet</code> and click <strong>Run</strong>. When the popup appears, click <em>Review permissions → Advanced → Go to Untitled project → Allow</em>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'demo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Your submissions are always saved locally in browser storage even if Google Sheets is offline. You can also seed demo records to test table sorting, search, and Excel export.
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSeedData}
                >
                  <Sparkles size={14} style={{ color: 'var(--accent-blue)' }} />
                  <span>Load 4 Realistic Demo Records</span>
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444' }}
                  onClick={handleClearData}
                >
                  <Trash2 size={14} />
                  <span>Clear All Local Records</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>

          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleSave}
          >
            <Check size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
