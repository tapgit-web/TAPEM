import React, { useState } from 'react';
import { 
  Eye, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  Building, 
  User, 
  Inbox, 
  FileDown,
  Phone 
} from 'lucide-react';
import { exportToXLSX } from '../utils/exportToExcel';

export default function WorkReportTable({ 
  reports = [], 
  onViewReport, 
  searchQuery = '' 
}) {
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc'); // latest submissions first

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort logic
  const sortedReports = [...reports].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';

    if (sortField === 'timestamp' || sortField === 'dateOfWork') {
      const aTime = new Date(aVal).getTime() || 0;
      const bTime = new Date(bVal).getTime() || 0;
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={13} style={{ opacity: 0.4 }} />;
    return sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
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

  if (reports.length === 0) {
    return (
      <div className="table-card">
        <div className="table-empty-state">
          <div className="table-empty-icon">
            <Inbox size={32} />
          </div>
          <h3 className="table-empty-title">No Work Reports Found</h3>
          <p className="table-empty-desc">
            {searchQuery 
              ? `No work reports match your search query "${searchQuery}". Try adjusting your filters.` 
              : 'No work reports have been submitted yet. Use the "Submit Report" tab to log your first work details.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-responsive-wrapper">
        <table className="reports-table" aria-label="Submitted Work Reports Table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('timestamp')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Logged At</span>
                  {getSortIcon('timestamp')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('employeeName')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Employee</span>
                  {getSortIcon('employeeName')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('dateOfWork')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Date of Work</span>
                  {getSortIcon('dateOfWork')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('siteOfWork')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Site / Supervisor</span>
                  {getSortIcon('siteOfWork')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('typeOfWork')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Type of Work</span>
                  {getSortIcon('typeOfWork')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('workStatus')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Status</span>
                  {getSortIcon('workStatus')}
                </div>
              </th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedReports.map((report) => {
              const contactPhone = report.siteContactPhone || report.siteContactPersonContactNumber || '';

              return (
                <tr key={report.id || report.timestamp}>
                  {/* Timestamp */}
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div className="font-mono">{report.timestamp || 'N/A'}</div>
                  </td>

                  {/* Employee Name & ID */}
                  <td>
                    <div className="employee-cell">
                      <span className="employee-cell-name">{report.employeeName}</span>
                      <span className="employee-cell-id">{report.employeeId}</span>
                    </div>
                  </td>

                  {/* Date of Work */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                      <Calendar size={14} style={{ color: 'var(--text-light)' }} />
                      <span>{report.dateOfWork}</span>
                    </div>
                  </td>

                  {/* Site, Contact Person, and Contact Number */}
                  <td>
                    <div className="site-cell">
                      <span className="site-cell-name" title={report.siteOfWork}>
                        {report.siteOfWork}
                      </span>
                      {report.siteContactPerson && report.siteContactPerson !== 'N/A' && (
                        <span className="site-cell-contact" title={report.siteContactPerson}>
                          Contact: {report.siteContactPerson}
                        </span>
                      )}
                      {contactPhone && contactPhone !== 'N/A' && (
                        <span 
                          className="font-mono" 
                          style={{ 
                            fontSize: '0.725rem', 
                            color: 'var(--accent-blue)', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            marginTop: '2px'
                          }}
                          title={`Contact Phone: ${contactPhone}`}
                        >
                          <Phone size={11} />
                          <span>{contactPhone}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Type of Work */}
                  <td>
                    <span className="work-type-tag" title={report.typeOfWork}>
                      {report.typeOfWork}
                    </span>
                  </td>

                  {/* Work Status */}
                  <td>
                    {getStatusBadge(report.workStatus)}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions-cell" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewReport(report)}
                        title="View complete report details"
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => exportToXLSX([report], `Report_${report.employeeId || 'Log'}`)}
                        title="Download single record as Excel file"
                        style={{ padding: '0.4rem' }}
                      >
                        <FileDown size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
