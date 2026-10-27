import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  FileSpreadsheet, 
  FileText, 
  RefreshCw, 
  Calendar, 
  Info, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import SummaryCards from '../components/SummaryCards';
import WorkReportTable from '../components/WorkReportTable';
import ReportDetailModal from '../components/ReportDetailModal';
import { exportToXLSX, exportToCSV } from '../utils/exportToExcel';
import { VALID_WORK_STATUSES } from '../utils/validation';

export default function Dashboard({ 
  reports = [], 
  onRefreshData, 
  isLoading = false, 
  showNotification,
  dataSource = 'local_storage',
  sheetName = 'Work_Reports'
}) {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Selected report for Details Modal
  const [selectedReport, setSelectedReport] = useState(null);

  // Filter logic
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // 1. Search Query (Employee Name, ID, Site, Supervisor, Phone, or Work Type)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const cleanQueryDigits = query.replace(/\D/g, '');
        const nameMatch = (report.employeeName || '').toLowerCase().includes(query);
        const idMatch = (report.employeeId || '').toLowerCase().includes(query);
        const siteMatch = (report.siteOfWork || '').toLowerCase().includes(query);
        const supervisorMatch = (report.siteContactPerson || '').toLowerCase().includes(query);
        const typeMatch = (report.typeOfWork || '').toLowerCase().includes(query);
        
        const phoneVal = (report.siteContactPhone || report.siteContactPersonContactNumber || '');
        const phoneMatch = phoneVal.toLowerCase().includes(query) || 
          (cleanQueryDigits.length >= 3 && phoneVal.replace(/\D/g, '').includes(cleanQueryDigits));

        if (!nameMatch && !idMatch && !siteMatch && !supervisorMatch && !typeMatch && !phoneMatch) {
          return false;
        }
      }

      // 2. Work Status Filter
      if (statusFilter && report.workStatus !== statusFilter) {
        return false;
      }

      // 3. Date of Work Filter
      if (dateFilter && report.dateOfWork !== dateFilter) {
        return false;
      }

      return true;
    });
  }, [reports, searchQuery, statusFilter, dateFilter]);

  const hasActiveFilters = searchQuery !== '' || statusFilter !== '' || dateFilter !== '';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter('');
  };

  // Excel (.xlsx) Export Handler
  const handleExportXLSX = (exportFilteredOnly = false) => {
    const dataToExport = exportFilteredOnly ? filteredReports : reports;
    if (dataToExport.length === 0) {
      showNotification('warning', 'No Records to Export', 'There are no records to include in the export.');
      return;
    }

    try {
      const filename = exportToXLSX(dataToExport, 'Employee_Work_Reports', exportFilteredOnly);
      showNotification(
        'success',
        'Excel File Generated',
        `Successfully downloaded ${dataToExport.length} report(s) as "${filename}".`
      );
    } catch (err) {
      showNotification('error', 'Export Failed', err.message);
    }
  };

  // CSV Export Handler
  const handleExportCSV = (exportFilteredOnly = false) => {
    const dataToExport = exportFilteredOnly ? filteredReports : reports;
    if (dataToExport.length === 0) {
      showNotification('warning', 'No Records to Export', 'There are no records to include in the export.');
      return;
    }

    try {
      const filename = exportToCSV(dataToExport, 'Employee_Work_Reports', exportFilteredOnly);
      showNotification(
        'success',
        'CSV Export Generated',
        `Successfully downloaded ${dataToExport.length} report(s) as "${filename}" with UTF-8 Excel support.`
      );
    } catch (err) {
      showNotification('error', 'Export Failed', err.message);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <div className="dashboard-header-row">
        <div className="dashboard-title-group">
          <h1>Submission History & Analytics</h1>
          <p>
            Review verified site reports, filter by engineer or date, and export directly to Microsoft Excel.
          </p>
        </div>

        <div className="dashboard-header-actions">
          {/* Sync / Refresh Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefreshData}
            disabled={isLoading}
            title="Fetch latest submissions from Google Sheets"
          >
            <RefreshCw size={15} className={isLoading ? 'spinner' : ''} />
            <span>{isLoading ? 'Syncing...' : 'Sync with Google Sheets'}</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Live Status Notice */}
      <div className="sheets-download-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Info size={18} style={{ flexShrink: 0 }} />
          <span>
            {dataSource === 'google_sheets' ? (
              <>
                <strong>Live Connected:</strong> Dashboard is synchronized with Google Sheet tab <code>"{sheetName}"</code>.
              </>
            ) : (
              <>
                <strong>Local Persistence Active:</strong> Submissions are safely preserved in browser storage. Link your Google Apps Script URL in Settings to sync live with Google Sheets.
              </>
            )}
          </span>
        </div>

        <div style={{ fontSize: '0.8125rem' }}>
          💡 <em>To export the Google Sheet itself:</em> Open your Google Sheet → Click <strong>File → Download → Microsoft Excel (.xlsx)</strong>.
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <SummaryCards 
        reports={reports} 
        activeStatusFilter={statusFilter}
        onStatusSelect={(status) => setStatusFilter(status)}
      />

      {/* Search & Filter Bar */}
      <div className="filter-card">
        <div className="filter-row">
          {/* Live Search Input */}
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Employee Name or ID (e.g. Ravi Kumar, EMP001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Controls Group */}
          <div className="filter-controls-group">
            {/* Status Dropdown */}
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
            >
              <option value="">All Statuses</option>
              {VALID_WORK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              className="filter-date-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by Date of Work"
              aria-label="Filter by Date of Work"
            />

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleClearFilters}
                title="Reset all filters"
                style={{ color: '#ef4444' }}
              >
                <RotateCcw size={14} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Info & Export Toolbar */}
        <div className="table-toolbar">
          <div className="table-results-info">
            Showing <strong>{filteredReports.length}</strong> of <strong>{reports.length}</strong> total records
            {hasActiveFilters && (
              <span style={{ color: 'var(--accent-blue)', marginLeft: '0.4rem', fontWeight: 600 }}>
                (Filters Active)
              </span>
            )}
          </div>

          {/* Export Buttons */}
          <div className="export-btn-group">
            {/* Export Filtered XLSX */}
            <button
              type="button"
              className="btn btn-export-excel btn-sm"
              onClick={() => handleExportXLSX(hasActiveFilters)}
              disabled={filteredReports.length === 0}
              title="Export visible reports to Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} />
              <span>
                Export to Excel (.xlsx) {hasActiveFilters ? `(${filteredReports.length})` : ''}
              </span>
            </button>

            {/* Export All XLSX if filters active */}
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleExportXLSX(false)}
                title="Export all reports in database"
              >
                <span>Export All ({reports.length})</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              type="button"
              className="btn btn-export-csv btn-sm"
              onClick={() => handleExportCSV(hasActiveFilters)}
              disabled={filteredReports.length === 0}
              title="Download UTF-8 CSV compatible with Excel"
            >
              <FileText size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Work Reports Table */}
      <WorkReportTable
        reports={filteredReports}
        onViewReport={(report) => setSelectedReport(report)}
        searchQuery={searchQuery}
      />

      {/* Full Report Details Inspection Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
