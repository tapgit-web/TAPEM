import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

/**
 * Toast Notification system for application feedback
 */
export default function Notification({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    if (toast.autoClose !== false) {
      const timer = setTimeout(() => {
        onDismiss();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="toast-icon" size={20} />;
      case 'error':
        return <XCircle className="toast-icon" size={20} />;
      case 'warning':
        return <AlertTriangle className="toast-icon" size={20} />;
      case 'info':
      default:
        return <Info className="toast-icon" size={20} />;
    }
  };

  return (
    <div className={`toast toast-${toast.type || 'info'}`} role="alert">
      {getIcon()}
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button 
        type="button" 
        className="toast-close-btn" 
        onClick={onDismiss}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
