import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Key, 
  ShieldCheck, 
  Flame, 
  Save 
} from 'lucide-react';
import { saveFirebaseConfig, reinitializeFirebase } from '../services/firebase';

export default function FirebaseGuideModal({ isOpen, onClose, onConfigSaved }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const sampleEnvText = `# Firebase Authentication Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(sampleEnvText);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSaveDirect = (e) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      alert('Please provide at least the API Key and Project ID.');
      return;
    }

    const config = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    saveFirebaseConfig(config);
    reinitializeFirebase();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onConfigSaved) onConfigSaved();
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 8, 
              background: '#f59e0b', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Flame size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>Firebase Authentication Setup</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Connect your Google Firebase project to WorkLog Enterprise</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Quick Steps Guide */}
          <div style={{ marginBottom: '1.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              1. Get your Firebase Configuration (2 minutes):
            </h4>
            <ol style={{ fontSize: '0.8rem', paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>
                Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Firebase Console <ExternalLink size={12} style={{ display: 'inline' }} /></a>.
              </li>
              <li>Create a new project or select an existing one.</li>
              <li>Under <strong>Build &rarr; Authentication</strong>, click <strong>Get Started</strong> and enable:
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.2rem' }}>
                  <li><strong>Email/Password</strong> (Enable & Save)</li>
                  <li><strong>Google</strong> (Enable, provide support email & Save)</li>
                </ul>
              </li>
              <li>Go to <strong>Project Settings (gear icon) &rarr; General &rarr; Your apps</strong> and add a <strong>Web app (&lt;/&gt;)</strong>.</li>
              <li>Copy the values from the <code>firebaseConfig</code> object.</li>
            </ol>
          </div>

          {/* Option A: Paste in .env */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Option A: Add keys to your <code>.env</code> file (Recommended)
              </span>
              <button 
                type="button" 
                onClick={handleCopyEnv}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', gap: '0.35rem' }}
              >
                {copiedKey ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                <span>{copiedKey ? 'Copied' : 'Copy Template'}</span>
              </button>
            </div>
            <pre style={{ 
              background: '#0f172a', 
              color: '#38bdf8', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              fontSize: '0.75rem', 
              fontFamily: 'JetBrains Mono, monospace',
              overflowX: 'auto' 
            }}>
              {sampleEnvText}
            </pre>
          </div>

          {/* Option B: Direct in-browser entry */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              Option B: Paste configuration directly in browser
            </h4>
            <form onSubmit={handleSaveDirect} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>apiKey *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="AIzaSy..." 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>projectId *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="your-project-id" 
                    value={projectId} 
                    onChange={(e) => setProjectId(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>authDomain</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="your-project.firebaseapp.com" 
                    value={authDomain} 
                    onChange={(e) => setAuthDomain(e.target.value)} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>appId</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="1:123456789012:web:abcdef" 
                    value={appId} 
                    onChange={(e) => setAppId(e.target.value)} 
                  />
                </div>
              </div>

              {saveSuccess && (
                <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                  Configuration saved and Firebase initialized!
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ gap: '0.4rem' }}>
                  <Save size={14} />
                  <span>Save Config to Browser</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
