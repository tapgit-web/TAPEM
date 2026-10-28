import React, { useState, useEffect } from 'react';
import { 
  X, 
  BadgeCheck, 
  User, 
  Mail, 
  Save, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ isOpen, onClose, showNotification }) {
  const { user, updateUserProfile } = useAuth();
  
  const [empId, setEmpId] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEmpId(user.employeeId || '');
      setFullName(user.displayName || '');
      setError('');
      setSuccess(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const trimmedId = empId.trim();
    const trimmedName = fullName.trim();

    if (!trimmedId) {
      setError('Employee ID is required (e.g. EMP001 or EMP-104).');
      return;
    }

    if (trimmedId.length < 2) {
      setError('Employee ID must be at least 2 characters long.');
      return;
    }

    if (!/^[A-Za-z0-9_-]+$/.test(trimmedId)) {
      setError('Employee ID can only contain letters, numbers, hyphens, and underscores.');
      return;
    }

    if (!trimmedName) {
      setError('Full Name is required.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: trimmedName,
        employeeId: trimmedId.toUpperCase()
      });

      setSuccess(true);
      if (showNotification) {
        showNotification(
          'success',
          'Employee ID Updated',
          `Your Employee ID has been set to "${trimmedId.toUpperCase()}".`
        );
      }

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      setIsSaving(false);
      setError(err.message || 'Failed to update employee ID.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: 10, 
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.35)'
            }}>
              <BadgeCheck size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>Employee ID & Profile</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Set your personal identification for work logs</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Feedback Banners */}
            {error && (
              <div style={{ 
                padding: '0.65rem 0.85rem', 
                background: 'var(--danger-bg)', 
                border: '1px solid var(--danger-border)', 
                borderRadius: '8px',
                color: 'var(--danger-color)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{ 
                padding: '0.65rem 0.85rem', 
                background: 'var(--status-completed-bg)', 
                border: '1px solid var(--status-completed-border)', 
                borderRadius: '8px',
                color: 'var(--status-completed-text)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>Employee details saved successfully!</span>
              </div>
            )}

            {/* Email (Read-Only) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                <Mail size={14} style={{ display: 'inline', marginRight: 4 }} />
                <span>Registered Account Email</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={user.email || 'N/A'}
                disabled
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
              />
            </div>

            {/* Employee ID (Primary editable field) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="profile-empid" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                <BadgeCheck size={14} style={{ display: 'inline', marginRight: 4, color: 'var(--accent-blue)' }} />
                <span>Employee ID *</span>
              </label>
              <input
                id="profile-empid"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. EMP001, EMP-104, TECH-42"
                value={empId}
                onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                required
                style={{ fontWeight: 700, letterSpacing: '0.04em' }}
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                This ID will be stamped onto every Google Sheet entry and Excel export you submit.
              </span>
            </div>

            {/* Full Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="profile-fullname" style={{ fontSize: '0.8rem' }}>
                <User size={14} style={{ display: 'inline', marginRight: 4 }} />
                <span>Full Name *</span>
              </label>
              <input
                id="profile-fullname"
                type="text"
                className="form-input"
                placeholder="e.g. Ravi Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Live Badge Preview */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px dashed var(--border-color)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                System Badge Preview:
              </span>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--primary-navy)',
                color: '#ffffff',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                <span>{fullName.trim() || 'Employee'}</span>
                <span style={{ 
                  background: 'var(--accent-blue)', 
                  color: '#ffffff', 
                  fontSize: '0.7rem', 
                  padding: '0.1rem 0.45rem', 
                  borderRadius: '10px',
                  fontFamily: 'JetBrains Mono, monospace'
                }}>
                  {empId.trim().toUpperCase() || 'EMP-XXXX'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ gap: '0.4rem' }}>
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Employee Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
