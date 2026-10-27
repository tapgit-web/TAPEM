import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  User, 
  MapPin, 
  Calendar, 
  Activity, 
  FileText, 
  Clock, 
  CheckCircle2,
  Phone 
} from 'lucide-react';

export default function ReportDetailModal({ report, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const contactPhone = report.siteContactPhone || report.siteContactPersonContactNumber || '';

  const handleCopy = () => {
    const textSummary = `
=========================================
APEX WORKLOG - EMPLOYEE WORK REPORT
=========================================
Record ID: ${report.id || 'N/A'}
Timestamp: ${report.timestamp || 'N/A'}
Employee Name: ${report.employeeName}
Employee ID: ${report.employeeId}
Date of Work: ${report.dateOfWork}
Site of Work: ${report.siteOfWork}
Site Contact Person: ${report.siteContactPerson}
Site Contact Person Contact Number: ${contactPhone || 'N/A'}
Type of Work: ${report.typeOfWork}
Work Status: ${report.workStatus}

WORK DESCRIPTION:
${report.workDescription}

PENDING WORK / NEXT STEPS:
${report.pendingWork || 'None recorded'}
=========================================
`.trim();

    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const s = status ? status.toLowerCase().replace(/\s+/g, '') : 'inprogress';
    return (
      <span className={`status-badge status-${s}`}>
        <span className="status-indicator-dot"></span>
        <span>{status || 'In Progress'}</span>
      </span>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '0.75rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Report Details Inspection
            </div>
            <h3 className="modal-title">Work Log: {report.employeeName} ({report.employeeId})</h3>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Metadata Grid */}
          <div className="detail-grid">
            <div className="detail-item-box">
              <div className="detail-label">Employee</div>
              <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} style={{ color: 'var(--accent-blue)' }} />
                <span>{report.employeeName}</span>
                <span className="font-mono" style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  ({report.employeeId})
                </span>
              </div>
            </div>

            <div className="detail-item-box">
              <div className="detail-label">Status & Classification</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                {getStatusBadge(report.workStatus)}
                <span className="work-type-tag" style={{ maxWidth: 'none' }}>{report.typeOfWork}</span>
              </div>
            </div>

            <div className="detail-item-box">
              <div className="detail-label">Site & Contact Supervisor</div>
              <div className="detail-value" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <MapPin size={16} style={{ color: 'var(--accent-blue)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{report.siteOfWork}</div>
                  {report.siteContactPerson && report.siteContactPerson !== 'N/A' ? (
                    <>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                        Contact Person: {report.siteContactPerson}
                      </div>
                      {contactPhone && contactPhone !== 'N/A' && (
                        <div style={{ fontSize: '0.8rem', marginTop: '3px' }}>
                          <a 
                            href={`tel:${contactPhone.replace(/\s+/g, '')}`} 
                            className="font-mono"
                            style={{ 
                              color: 'var(--accent-blue)', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.3rem',
                              textDecoration: 'none',
                              fontWeight: 600
                            }}
                            title="Click to call supervisor"
                          >
                            <Phone size={13} />
                            <span>{contactPhone}</span>
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: '2px' }}>
                      Internal / Remote site (No external supervisor contact)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="detail-item-box">
              <div className="detail-label">Dates & System Stamp</div>
              <div className="detail-value">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} style={{ color: 'var(--accent-blue)' }} />
                  <span>Work Date: {report.dateOfWork}</span>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  System Logged: <span className="font-mono">{report.timestamp || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Description Box */}
          <div className="detail-block-box">
            <div className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={14} />
              <span>Full Work Description</span>
            </div>
            <div className="detail-block-content">
              {report.workDescription}
            </div>
          </div>

          {/* Pending Work Box */}
          <div className="detail-block-box">
            <div className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={14} />
              <span>Pending Work / Next Steps</span>
            </div>
            <div className="detail-block-content" style={{ color: report.pendingWork ? 'var(--text-main)' : 'var(--text-light)' }}>
              {report.pendingWork || 'No pending work or next steps specified for this report.'}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: '#10b981' }} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={handlePrint}
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>

          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
