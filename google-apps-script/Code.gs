/**
 * =========================================================================
 * Employee Work Details Management System - Google Apps Script Backend
 * =========================================================================
 *
 * This script runs in Google Apps Script attached to a Google Spreadsheet.
 * It acts as a serverless REST API that:
 * 1. Receives work reports via HTTP POST (`doPost`) and appends them to Google Sheets.
 * 2. Fetches saved work reports via HTTP GET (`doGet`) for the React dashboard.
 * 3. Handles automatic header creation, formatting, validation, and concurrency locks.
 *
 * Column Structure (11 Columns):
 * Col 1:  Timestamp
 * Col 2:  Employee Name
 * Col 3:  Employee ID
 * Col 4:  Date of Work
 * Col 5:  Site of Work
 * Col 6:  Site Contact Person
 * Col 7:  Site Contact Person Contact Number
 * Col 8:  Type of Work
 * Col 9:  Work Description
 * Col 10: Work Status
 * Col 11: Pending Work / Next Steps
 */

// Configuration
var SHEET_NAME = 'Work_Reports'; // Name of the sheet tab (creates automatically if missing)

// Optional: Spreadsheet ID for standalone scripts (created via script.google.com).
// If script is opened directly from your Google Sheet via Extensions -> Apps Script, leave this as-is or blank.
var SPREADSHEET_ID = '174vVaQSLZquHCB1tOAIkzjhrLOPsR4AhlxkebaLI7fM';

var HEADERS = [
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

var VALID_STATUSES = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

/**
 * Gets or initializes the target worksheet with formatted headers.
 * Supports both container-bound scripts (inside Google Sheet) and standalone scripts.
 */
function getTargetSheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    ss = null;
  }

  if (!ss && SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch (e) {
      Logger.log('Could not open spreadsheet by ID: ' + e);
    }
  }

  if (!ss) {
    throw new Error('Spreadsheet not found! If running standalone, set SPREADSHEET_ID. If container-bound, ensure script is opened via Extensions -> Apps Script.');
  }

  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    // If named sheet doesn't exist, use the active sheet or create one
    var activeSheet = ss.getActiveSheet();
    if (activeSheet && activeSheet.getLastRow() === 0 && activeSheet.getLastColumn() === 0) {
      activeSheet.setName(SHEET_NAME);
      sheet = activeSheet;
    } else {
      sheet = ss.insertSheet(SHEET_NAME);
    }
  }

  // Check if headers need initialization or update
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    
    // Style the header row (Company Navy Blue with White Text)
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#0F233A');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setFontFamily('Arial');
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    headerRange.setWrap(true);
    
    sheet.setRowHeight(1, 36);
    sheet.setFrozenRows(1);

    // Auto resize columns
    for (var i = 1; i <= HEADERS.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}

/**
 * Handles HTTP POST requests: validates incoming report and appends to Google Sheet
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  
  try {
    // Acquire lock for up to 30 seconds to prevent concurrent row overlap
    lock.waitLock(30000);

    var sheet = getTargetSheet();
    var data;

    // Parse incoming payload (supports JSON body, form-urlencoded, or parameter query)
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        // Fallback for form-urlencoded or plain text
        data = e.parameter;
      }
    } else if (e.parameter && Object.keys(e.parameter).length > 0) {
      data = e.parameter;
    } else {
      return createJsonResponse({
        success: false,
        error: 'No data payload received. Send JSON body or form parameters.'
      }, 400);
    }

    // Server-side validation
    var validationError = validateReportData(data);
    if (validationError) {
      return createJsonResponse({
        success: false,
        error: validationError
      }, 400);
    }

    // Format fields
    var now = new Date();
    var timestampStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd HH:mm:ss');
    
    var employeeName = String(data.employeeName || '').trim();
    var employeeId = String(data.employeeId || '').trim();
    var dateOfWork = String(data.dateOfWork || '').trim();
    var siteOfWork = String(data.siteOfWork || '').trim();
    var isInternal = (siteOfWork === 'Office' || siteOfWork === 'Work From Home' || siteOfWork.toLowerCase() === 'office' || siteOfWork.toLowerCase() === 'work from home');

    var siteContactPerson = isInternal 
      ? (String(data.siteContactPerson || '').trim() || 'N/A') 
      : String(data.siteContactPerson || '').trim();

    var siteContactPhone = isInternal 
      ? (String(data.siteContactPhone || data.siteContactPersonContactNumber || '').trim() || 'N/A') 
      : String(data.siteContactPhone || data.siteContactPersonContactNumber || '').trim();

    var typeOfWork = String(data.typeOfWork || '').trim();
    var workDescription = String(data.workDescription || '').trim();
    var workStatus = String(data.workStatus || 'In Progress').trim();
    var pendingWork = String(data.pendingWork || '').trim();

    // Preserve phone formatting and leading zeros/plus signs in Google Sheets
    // Prefixing with an apostrophe if it starts with '+' prevents Google Sheets from interpreting '+' as a formula
    var formattedPhone = siteContactPhone.startsWith('+') ? "'" + siteContactPhone : siteContactPhone;

    // Row array matching the exact 11 columns
    var rowValues = [
      timestampStr,
      employeeName,
      employeeId,
      dateOfWork,
      siteOfWork,
      siteContactPerson,
      formattedPhone,
      typeOfWork,
      workDescription,
      workStatus,
      pendingWork
    ];

    sheet.appendRow(rowValues);
    var newRowNumber = sheet.getLastRow();

    // Format new row styling
    var newRowRange = sheet.getRange(newRowNumber, 1, 1, HEADERS.length);
    newRowRange.setFontFamily('Arial');
    newRowRange.setFontSize(10);
    newRowRange.setVerticalAlignment('top');
    
    // Status color highlighting in the sheet (Work Status is now Column 10)
    var statusCell = sheet.getRange(newRowNumber, 10);
    if (workStatus === 'Completed') {
      statusCell.setBackground('#D1FAE5');
      statusCell.setFontColor('#065F46');
    } else if (workStatus === 'In Progress') {
      statusCell.setBackground('#DBEAFE');
      statusCell.setFontColor('#1E40AF');
    } else if (workStatus === 'On Hold') {
      statusCell.setBackground('#FEE2E2');
      statusCell.setFontColor('#991B1B');
    } else if (workStatus === 'Not Started') {
      statusCell.setBackground('#F3F4F6');
      statusCell.setFontColor('#374151');
    }

    return createJsonResponse({
      success: true,
      message: 'Work report submitted and recorded successfully in Google Sheets.',
      row: newRowNumber,
      recordId: 'REC-' + newRowNumber,
      timestamp: timestampStr,
      data: {
        timestamp: timestampStr,
        employeeName: employeeName,
        employeeId: employeeId,
        dateOfWork: dateOfWork,
        siteOfWork: siteOfWork,
        siteContactPerson: siteContactPerson,
        siteContactPhone: siteContactPhone,
        typeOfWork: typeOfWork,
        workDescription: workDescription,
        workStatus: workStatus,
        pendingWork: pendingWork
      }
    }, 200);

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: 'Server error processing work report: ' + err.toString()
    }, 500);
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {
      // Lock release fallback
    }
  }
}

/**
 * Handles HTTP GET requests:
 * - Ping check: `?action=ping`
 * - Fetch reports: returns all rows as JSON array for the React dashboard
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var sheet = getTargetSheet();

    // 1. Ping / Test connection
    if (params.action === 'ping') {
      return createJsonResponse({
        success: true,
        status: 'online',
        message: 'Google Apps Script Web App is connected and responding.',
        sheetName: sheet.getName(),
        spreadsheetTitle: sheet.getParent().getName(),
        totalRows: sheet.getLastRow(),
        timestamp: new Date().toISOString()
      }, 200, params.callback);
    }

    // 2. Fetch all work report records
    var lastRow = sheet.getLastRow();
    var reports = [];

    if (lastRow > 1) {
      var numColumns = HEADERS.length;
      var values = sheet.getRange(2, 1, lastRow - 1, numColumns).getValues();

      for (var i = 0; i < values.length; i++) {
        var row = values[i];
        var rowNum = i + 2;
        
        // Skip empty rows
        if (!row[1] && !row[2]) continue;

        var rawTimestamp = row[0];
        var timestampStr = '';
        if (rawTimestamp instanceof Date) {
          timestampStr = Utilities.formatDate(rawTimestamp, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd HH:mm:ss');
        } else {
          timestampStr = String(rawTimestamp || '');
        }

        var rawDateOfWork = row[3];
        var dateOfWorkStr = '';
        if (rawDateOfWork instanceof Date) {
          dateOfWorkStr = Utilities.formatDate(rawDateOfWork, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd');
        } else {
          dateOfWorkStr = String(rawDateOfWork || '');
        }

        var rawPhone = String(row[6] || '');
        // Strip leading apostrophe if present from text formatting
        if (rawPhone.startsWith("'")) {
          rawPhone = rawPhone.substring(1);
        }

        reports.push({
          id: 'REC-' + rowNum,
          rowNumber: rowNum,
          timestamp: timestampStr,
          employeeName: String(row[1] || ''),
          employeeId: String(row[2] || ''),
          dateOfWork: dateOfWorkStr,
          siteOfWork: String(row[4] || ''),
          siteContactPerson: String(row[5] || ''),
          siteContactPhone: rawPhone,
          typeOfWork: String(row[7] || ''),
          workDescription: String(row[8] || ''),
          workStatus: String(row[9] || 'In Progress'),
          pendingWork: String(row[10] || '')
        });
      }

      // Sort newest first by default
      reports.reverse();
    }

    return createJsonResponse({
      success: true,
      count: reports.length,
      data: reports,
      sheetName: sheet.getName(),
      lastUpdated: new Date().toISOString()
    }, 200, params.callback);

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: 'Error retrieving work reports: ' + err.toString()
    }, 500, (e && e.parameter) ? e.parameter.callback : null);
  }
}

/**
 * Validates the required fields of the report
 */
function validateReportData(data) {
  if (!data) return 'Request body is empty';
  
  if (!data.employeeName || String(data.employeeName).trim() === '') {
    return 'Employee Name is required';
  }
  if (!data.employeeId || String(data.employeeId).trim() === '') {
    return 'Employee ID is required';
  }
  if (!data.dateOfWork || String(data.dateOfWork).trim() === '') {
    return 'Date of Work is required';
  }
  if (!data.siteOfWork || String(data.siteOfWork).trim() === '') {
    return 'Site of Work is required';
  }

  var siteStr = String(data.siteOfWork).trim();
  var isInternal = (siteStr === 'Office' || siteStr === 'Work From Home' || siteStr.toLowerCase() === 'office' || siteStr.toLowerCase() === 'work from home');

  // Contact person and contact phone are only required for external/client sites ("Others")
  if (!isInternal) {
    var contactPerson = String(data.siteContactPerson || '').trim();
    if (!contactPerson || contactPerson === 'N/A') {
      return 'Site Contact Person is required for external sites';
    }

    var phone = String(data.siteContactPhone || data.siteContactPersonContactNumber || '').trim();
    if (!phone || phone === 'N/A') {
      return 'Site Contact Person Contact Number is required for external sites';
    }
    if (/[a-zA-Z]/.test(phone)) {
      return 'Site Contact Person Contact Number cannot contain letters';
    }
    var phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return 'Site Contact Person Contact Number must be a valid phone number (7 to 15 digits)';
    }
  }

  if (!data.typeOfWork || String(data.typeOfWork).trim() === '') {
    return 'Type of Work is required';
  }
  if (!data.workDescription || String(data.workDescription).trim() === '') {
    return 'Work Description is required';
  }
  if (!data.workStatus || String(data.workStatus).trim() === '') {
    return 'Work Status is required';
  }
  if (VALID_STATUSES.indexOf(String(data.workStatus).trim()) === -1) {
    return 'Invalid Work Status. Must be one of: ' + VALID_STATUSES.join(', ');
  }

  return null; // Valid
}

/**
 * Helper to build JSON or JSONP HTTP response
 */
function createJsonResponse(dataObj, statusCode, callback) {
  var jsonString = JSON.stringify(dataObj);

  // If JSONP callback parameter is present
  if (callback) {
    var output = ContentService.createTextOutput(callback + '(' + jsonString + ');');
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return output;
  }

  var output = ContentService.createTextOutput(jsonString);
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * One-time setup utility to initialize sheet headers manually from Apps Script Editor
 */
function setupSheet() {
  var sheet = getTargetSheet();
  Logger.log('Work_Reports sheet ready in: ' + sheet.getParent().getName());
}
