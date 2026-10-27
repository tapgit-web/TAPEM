/**
 * Export utilities for Employee Work Reports
 * Supports direct Microsoft Excel (.xlsx) using SheetJS and Excel-compatible UTF-8 CSV.
 */
import * as XLSX from 'xlsx';

export const EXCEL_HEADERS = [
  'Timestamp',
  'Employee Name',
  'Employee ID',
  'Date of Work',
  'Site of Work',
  'Site Contact Person',
  'Site Contact Person Contact Number',
  'Type of Work',
  'Work Description',
  'Work Status',
  'Pending Work / Next Steps'
];

/**
 * Transforms an array of report objects into tabular 2D array matching the exact column order
 * @param {Array<Object>} reports 
 * @returns {Array<Array<string>>}
 */
function prepareReportRows(reports) {
  return reports.map((report) => [
    report.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
    report.employeeName || '',
    report.employeeId || '',
    report.dateOfWork || '',
    report.siteOfWork || '',
    report.siteContactPerson || '',
    // Store phone as text string preserving '+', country code, and leading zeros
    String(report.siteContactPhone || report.siteContactPersonContactNumber || ''),
    report.typeOfWork || '',
    report.workDescription || '',
    report.workStatus || 'In Progress',
    report.pendingWork || ''
  ]);
}

/**
 * Exports reports to a genuine Microsoft Excel (.xlsx) file
 * @param {Array<Object>} reports 
 * @param {string} [filenamePrefix='Employee_Work_Reports'] 
 * @param {boolean} [isFiltered=false]
 */
export function exportToXLSX(reports, filenamePrefix = 'Employee_Work_Reports', isFiltered = false) {
  if (!reports || reports.length === 0) {
    throw new Error('No records available to export.');
  }

  const rows = prepareReportRows(reports);
  const worksheetData = [EXCEL_HEADERS, ...rows];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set professional column widths for Excel (11 Columns)
  worksheet['!cols'] = [
    { wch: 22 }, // Timestamp
    { wch: 22 }, // Employee Name
    { wch: 16 }, // Employee ID
    { wch: 15 }, // Date of Work
    { wch: 28 }, // Site of Work
    { wch: 24 }, // Site Contact Person
    { wch: 24 }, // Site Contact Person Contact Number
    { wch: 26 }, // Type of Work
    { wch: 45 }, // Work Description
    { wch: 16 }, // Work Status
    { wch: 35 }  // Pending Work / Next Steps
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Reports');

  // Add metadata
  workbook.Props = {
    Title: 'Employee Work Details Report',
    Subject: 'Industrial Work Logs',
    Author: 'Apex WorkLog Management System',
    CreatedDate: new Date()
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const filterTag = isFiltered ? '_Filtered' : '_All';
  const filename = `${filenamePrefix}${filterTag}_${todayStr}.xlsx`;

  // Trigger browser download
  XLSX.writeFile(workbook, filename);
  return filename;
}

/**
 * Exports reports to an Excel-compatible CSV with UTF-8 BOM
 * @param {Array<Object>} reports 
 * @param {string} [filenamePrefix='Employee_Work_Reports'] 
 * @param {boolean} [isFiltered=false]
 */
export function exportToCSV(reports, filenamePrefix = 'Employee_Work_Reports', isFiltered = false) {
  if (!reports || reports.length === 0) {
    throw new Error('No records available to export.');
  }

  const rows = prepareReportRows(reports);
  const allRows = [EXCEL_HEADERS, ...rows];

  // Helper to escape CSV cell content
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const cellStr = String(cell).replace(/"/g, '""');
    return `"${cellStr}"`;
  };

  const csvContent = allRows
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n');

  // \uFEFF is the UTF-8 Byte Order Mark (BOM) ensuring Excel recognizes UTF-8 (Hindi, Umlauts, accented names)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const filterTag = isFiltered ? '_Filtered' : '_All';
  const filename = `${filenamePrefix}${filterTag}_${todayStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}
