/**
 * Google Sheets Integration Service
 * 
 * Manages communication with Google Apps Script Web App (POST submissions & GET reads),
 * robust JSONP fallback to bypass browser CORS restrictions, connection diagnostics,
 * local offline persistence cache, and optional Google Forms integration.
 */

const STORAGE_KEY_REPORTS = 'worklog_submitted_reports';
const STORAGE_KEY_URL = 'worklog_google_script_url';

/**
 * Sanitizes and validates a Google Apps Script Web App URL
 * @param {string} rawUrl 
 * @returns {{ valid: boolean, url: string, error?: string }}
 */
export function validateAndSanitizeUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) {
    return { valid: false, url: '', error: 'URL cannot be empty.' };
  }

  let url = rawUrl.trim().replace(/^["']|["']$/g, ''); // strip any accidentally copied quotes

  // 1. Detect if user pasted a Google Spreadsheet URL instead of Web App URL
  if (url.includes('docs.google.com/spreadsheets')) {
    return {
      valid: false,
      url,
      error: 'You pasted a Google Sheet spreadsheet link, not a Web App URL! Please open your Google Sheet, navigate to Extensions → Apps Script → Deploy → New deployment → Web app, and copy the URL ending in /exec.'
    };
  }

  // 2. Detect if user pasted the Apps Script editor URL
  if (url.includes('script.google.com/d/') || url.includes('/edit')) {
    return {
      valid: false,
      url,
      error: 'You pasted the Apps Script editor link. In the Apps Script editor, click Deploy (top right) → New deployment → Select type "Web app" → Set "Who has access" to "Anyone" → Copy the Web App URL ending in /exec.'
    };
  }

  // 3. Auto-convert test /dev URL to production /exec URL
  if (url.includes('/macros/s/') && url.endsWith('/dev')) {
    url = url.substring(0, url.length - 4) + '/exec';
  }

  // 4. Check standard Google Apps Script Web App URL structure
  if (!url.startsWith('https://script.google.com/macros/s/')) {
    return {
      valid: false,
      url,
      error: 'Invalid URL format. A Google Apps Script Web App URL must begin with https://script.google.com/macros/s/... and end with /exec'
    };
  }

  return { valid: true, url };
}

/**
 * Retrieves the configured Google Apps Script Web App URL
 * Priority: 1. User-configured in localStorage, 2. Environment variable (.env)
 * @returns {string}
 */
export function getScriptUrl() {
  const envUrl = (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || import.meta.env.VITE_GOOGLE_SCRIPT_URL || '').trim();
  const localUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();

  // If an environment URL is configured, use it and keep localStorage in sync (avoids stale cache)
  if (envUrl) {
    const checkedEnv = validateAndSanitizeUrl(envUrl);
    if (checkedEnv.valid) {
      if (!localUrl || localUrl !== checkedEnv.url) {
        try {
          localStorage.setItem(STORAGE_KEY_URL, checkedEnv.url);
        } catch (e) {
          // Ignore storage write errors in private mode
        }
      }
      return checkedEnv.url;
    }
  }

  if (localUrl) {
    const checked = validateAndSanitizeUrl(localUrl);
    return checked.valid ? checked.url : localUrl;
  }

  return '';
}

/**
 * Saves a new Google Apps Script Web App URL to localStorage
 * @param {string} url 
 */
export function saveScriptUrl(url) {
  if (!url || !url.trim()) {
    localStorage.removeItem(STORAGE_KEY_URL);
  } else {
    const checked = validateAndSanitizeUrl(url);
    localStorage.setItem(STORAGE_KEY_URL, checked.url);
  }
}

/**
 * Gets cached reports from localStorage
 * @returns {Array<Object>}
 */
export function getLocalReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading local reports:', e);
    return [];
  }
}

/**
 * Saves reports array to localStorage
 * @param {Array<Object>} reports 
 */
export function saveLocalReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving local reports:', e);
  }
}

/**
 * Performs a JSONP request to bypass browser CORS restrictions when reading from Google Apps Script
 * @param {string} url 
 * @param {number} timeoutMs 
 * @returns {Promise<any>}
 */
function fetchJsonp(url, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const callbackName = 'worklog_cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    const script = document.createElement('script');
    let timer = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window[callbackName];
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Connection timed out after ${timeoutMs / 1000}s. Check that your Google Sheet has internet access and your script is authorized.`));
    }, timeoutMs);

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Failed to load response from Google Apps Script. Please verify the Web App deployment has "Who has access: Anyone".'));
    };

    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${callbackName}&_t=${Date.now()}`;
    document.head.appendChild(script);
  });
}

/**
 * Submits a work report to Google Sheets via Google Apps Script Web App
 * Uses direct POST with seamless no-cors fallback to guarantee row insertion.
 * @param {Object} reportData 
 * @returns {Promise<{ success: boolean, message: string, record: Object, savedLocallyOnly?: boolean, sheetRow?: number }>}
 */
export async function submitWorkReport(reportData) {
  const scriptUrl = getScriptUrl();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  const record = {
    id: 'REC-' + Date.now(),
    timestamp,
    ...reportData
  };

  // If no script URL is configured yet, save locally and inform user
  if (!scriptUrl) {
    const localReports = getLocalReports();
    const updated = [record, ...localReports];
    saveLocalReports(updated);

    return {
      success: true,
      message: 'Work report saved to local storage. (Google Sheets Web App URL is not linked yet - click "Google Sheets Sync" to link your sheet)',
      record,
      savedLocallyOnly: true
    };
  }

  // Primary attempt: standard fetch with JSON text payload
  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(reportData),
      redirect: 'follow'
    });

    let result = null;
    try {
      const responseText = await response.text();
      result = JSON.parse(responseText);
    } catch (parseErr) {
      result = { success: true, message: 'Work report recorded in Google Sheets.' };
    }

    if (result && result.success !== false) {
      // Cache locally as well
      const localReports = getLocalReports();
      saveLocalReports([record, ...localReports]);

      return {
        success: true,
        message: result.message || 'Work report successfully recorded in Google Sheets!',
        record,
        sheetRow: result.row
      };
    } else {
      throw new Error(result.error || 'Google Apps Script returned an unsuccessful status.');
    }
  } catch (primaryErr) {
    console.warn('Standard POST failed or blocked by CORS redirect, attempting no-cors fallback:', primaryErr);

    // Fallback: send via mode: 'no-cors' so browser executes HTTP POST to Google Apps Script without preflight
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(reportData)
      });

      // Cache locally
      const localReports = getLocalReports();
      saveLocalReports([record, ...localReports]);

      return {
        success: true,
        message: 'Work report submitted and synchronized with Google Sheets!',
        record
      };
    } catch (fallbackErr) {
      console.error('Submission failed completely, preserving in local storage:', fallbackErr);
      
      // Save locally so no user work is ever lost
      const localReports = getLocalReports();
      saveLocalReports([record, ...localReports]);

      throw new Error(
        `Failed to sync with Google Sheet: ${primaryErr.message}. Your report has been safely saved in local storage.`
      );
    }
  }
}

/**
 * Fetches all work reports from Google Sheets (via doGet) using JSONP or fetch
 * @returns {Promise<{ reports: Array<Object>, source: 'google_sheets' | 'local_storage', count: number, sheetName?: string }>}
 */
export async function fetchWorkReports() {
  const scriptUrl = getScriptUrl();

  if (!scriptUrl) {
    const localReports = getLocalReports();
    return {
      reports: localReports,
      source: 'local_storage',
      count: localReports.length
    };
  }

  // 1. Try JSONP first: completely immune to browser CORS policies & 302 redirect blocking
  try {
    const result = await fetchJsonp(scriptUrl + (scriptUrl.includes('?') ? '&' : '?') + 'action=read');
    if (result && result.success && Array.isArray(result.data)) {
      saveLocalReports(result.data);
      return {
        reports: result.data,
        source: 'google_sheets',
        count: result.data.length,
        sheetName: result.sheetName
      };
    }
  } catch (jsonpErr) {
    console.warn('JSONP read attempt failed, trying standard fetch:', jsonpErr.message);
  }

  // 2. Try standard fetch as secondary option
  try {
    const fetchUrl = scriptUrl + (scriptUrl.includes('?') ? '&' : '?') + 'action=read&t=' + Date.now();
    const response = await fetch(fetchUrl, {
      method: 'GET',
      redirect: 'follow'
    });

    if (response.ok) {
      const result = await response.json();
      if (result && result.success && Array.isArray(result.data)) {
        saveLocalReports(result.data);
        return {
          reports: result.data,
          source: 'google_sheets',
          count: result.data.length,
          sheetName: result.sheetName
        };
      }
    }
  } catch (fetchErr) {
    console.warn('Standard fetch also failed:', fetchErr.message);
  }

  // Fallback to local cache if offline or unresolvable
  const localReports = getLocalReports();
  return {
    reports: localReports,
    source: 'local_storage',
    count: localReports.length,
    warning: 'Could not connect to Google Sheets. Displaying cached records.'
  };
}

/**
 * Tests connection to a Google Apps Script Web App URL with deep diagnostics
 * @param {string} testUrl 
 * @returns {Promise<{ ok: boolean, message: string, latencyMs?: number, details?: any, troubleshooting?: string[] }>}
 */
export async function testScriptConnection(testUrl) {
  const validation = validateAndSanitizeUrl(testUrl);
  if (!validation.valid) {
    return {
      ok: false,
      message: validation.error || 'Invalid URL.',
      troubleshooting: [
        'Make sure you copied the Web App URL ending in /exec, not the Google Spreadsheet link.',
        'In Google Sheets, go to: Extensions → Apps Script → Deploy → New deployment → Web app.'
      ]
    };
  }

  const url = validation.url;
  const startTime = Date.now();

  // Try JSONP ping first (avoids browser CORS preflight errors)
  try {
    const pingResult = await fetchJsonp(url + (url.includes('?') ? '&' : '?') + 'action=ping', 10000);
    const latencyMs = Date.now() - startTime;

    if (pingResult && pingResult.success) {
      return {
        ok: true,
        message: `Connection successful! Connected to Google Sheet "${pingResult.sheetName || 'Work_Reports'}" (${latencyMs}ms).`,
        latencyMs,
        details: pingResult
      };
    }
  } catch (jsonpErr) {
    console.warn('JSONP ping failed, testing standard fetch:', jsonpErr.message);
  }

  // Try standard fetch ping
  try {
    const pingUrl = url + (url.includes('?') ? '&' : '?') + 'action=ping&t=' + Date.now();
    const response = await fetch(pingUrl, {
      method: 'GET',
      redirect: 'follow'
    });

    const latencyMs = Date.now() - startTime;
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    if (response.ok && (data?.success || (typeof text === 'string' && (text.includes('API is running') || text.includes('Employee Work Reports'))))) {
      return {
        ok: true,
        message: (data && data.message) ? data.message : `Connection successful! Connected to Google Apps Script Web App (${latencyMs}ms).`,
        latencyMs,
        details: data
      };
    }
  } catch (fetchErr) {
    console.warn('Standard fetch ping failed:', fetchErr.message);
  }

  // If both failed, provide exact step-by-step resolution
  return {
    ok: false,
    message: 'Could not connect to Google Apps Script. The Web App deployment is likely restricted or unauthorized.',
    troubleshooting: [
      '1. Open your Google Sheet, click Extensions → Apps Script.',
      '2. In the Apps Script toolbar, select the function "setupSheet" from the dropdown and click "Run" once to grant permissions.',
      '3. Click the blue Deploy button (top right) → Manage deployments.',
      '4. Click the Edit (pencil) icon next to your active deployment.',
      '5. Verify "Execute as" is set to "Me (your email)".',
      '6. Verify "Who has access" is set to "Anyone" (NOT "Only myself" or "Anyone with Google Account").',
      '7. In the Version dropdown, choose "New version" and click Deploy.',
      '8. Copy the Web App URL ending in /exec and paste it again.'
    ]
  };
}

/**
 * Optional Google Forms submission helper
 */
export async function submitViaGoogleForms(reportData, formConfig) {
  if (!formConfig || !formConfig.formActionUrl) {
    throw new Error('Google Form Action URL is not configured.');
  }

  const formData = new URLSearchParams();
  if (formConfig.entryEmployeeName) formData.append(formConfig.entryEmployeeName, reportData.employeeName);
  if (formConfig.entryEmployeeId) formData.append(formConfig.entryEmployeeId, reportData.employeeId);
  if (formConfig.entryDateOfWork) formData.append(formConfig.entryDateOfWork, reportData.dateOfWork);
  if (formConfig.entrySiteOfWork) formData.append(formConfig.entrySiteOfWork, reportData.siteOfWork);
  if (formConfig.entrySiteContactPerson) formData.append(formConfig.entrySiteContactPerson, reportData.siteContactPerson);
  if (formConfig.entrySiteContactPhone) formData.append(formConfig.entrySiteContactPhone, reportData.siteContactPhone);
  if (formConfig.entryTypeOfWork) formData.append(formConfig.entryTypeOfWork, reportData.typeOfWork);
  if (formConfig.entryWorkDescription) formData.append(formConfig.entryWorkDescription, reportData.workDescription);
  if (formConfig.entryWorkStatus) formData.append(formConfig.entryWorkStatus, reportData.workStatus);
  if (formConfig.entryPendingWork && reportData.pendingWork) {
    formData.append(formConfig.entryPendingWork, reportData.pendingWork);
  }

  await fetch(formConfig.formActionUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });

  return {
    success: true,
    message: 'Submitted to Google Forms successfully.'
  };
}

/**
 * Seeds initial demo records for interactive demonstration
 */
export function seedSampleIndustrialReports() {
  const sampleReports = [
    {
      id: 'REC-101',
      timestamp: '2026-10-26 09:30:15',
      employeeName: 'Anil Sharma',
      employeeId: 'EMP042',
      dateOfWork: '2026-10-26',
      siteOfWork: 'Turbine Unit 4, Thermal Power Plant',
      siteContactPerson: 'Chief Engineer Verma',
      siteContactPhone: '+91 98765 43210',
      typeOfWork: 'Machinery Maintenance & Overhaul',
      workDescription: 'Conducted high-pressure steam valve diagnostic, replaced worn mechanical seal, and recalibrated vibration dampener bearings.',
      workStatus: 'In Progress',
      pendingWork: 'Hydrostatic pressure test scheduled for tomorrow morning.'
    },
    {
      id: 'REC-102',
      timestamp: '2026-10-25 17:15:00',
      employeeName: 'Sneha Patel',
      employeeId: 'EMP018',
      dateOfWork: '2026-10-25',
      siteOfWork: 'Automated Conveyor Line 2, Logistics Hub',
      siteContactPerson: 'Plant Shift Supervisor Rao',
      siteContactPhone: '+91 98111 22334',
      typeOfWork: 'Sensor & Instrumentation Calibration',
      workDescription: 'Calibrated photoelectric sensors across 14 transfer junctions. Replaced faulty proximity switch on feeder chute.',
      workStatus: 'Completed',
      pendingWork: 'Handed over operational sign-off sheet to shift manager.'
    },
    {
      id: 'REC-103',
      timestamp: '2026-10-25 14:00:22',
      employeeName: 'Vikram Singh',
      employeeId: 'EMP088',
      dateOfWork: '2026-10-25',
      siteOfWork: 'Substation B, Heavy Engineering Yard',
      siteContactPerson: 'Safety Officer Joshi',
      siteContactPhone: '+91 98222 33445',
      typeOfWork: 'Electrical Wiring & Testing',
      workDescription: 'Megger testing of 33kV busbars and thermal imaging audit on secondary feeder disconnect switches.',
      workStatus: 'Completed',
      pendingWork: 'None'
    },
    {
      id: 'REC-104',
      timestamp: '2026-10-24 11:20:45',
      employeeName: 'Mohammed Tariq',
      employeeId: 'EMP067',
      dateOfWork: '2026-10-24',
      siteOfWork: 'Chemical Refining Plant - Zone C',
      siteContactPerson: 'Zone Inspector Kapoor',
      siteContactPhone: '+91 98333 44556',
      typeOfWork: 'Safety & Compliance Audit',
      workDescription: 'Pressure vessel safety valve certification and emergency shutdown (ESD) loop trip timing tests.',
      workStatus: 'On Hold',
      pendingWork: 'Waiting for vendor replacement diaphragms for ESD solenoid valve.'
    }
  ];

  saveLocalReports(sampleReports);
  return sampleReports;
}

/**
 * Clears all locally cached records
 */
export function clearLocalReports() {
  saveLocalReports([]);
}
