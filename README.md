# Employee Work Details Management System (WorkLog Pro)

A modern, responsive, industrial-grade web application built with **React.js (Vite)**, **Standard CSS**, and **Google Sheets** (via **Google Apps Script** or **Google Forms**). Designed for manufacturing, engineering, and field operations to log employee work reports, synchronize them with Google Sheets in real time, inspect submissions via an analytics dashboard, and export data directly to **Microsoft Excel (.xlsx)** and **CSV**.

---

## 🌟 Key Features

- **Company-Grade Industrial UI/UX:** Clean, high-contrast industrial theme featuring Deep Navy (`#0F233A`), Precision Blue (`#0284C7`), subtle card shadows, and responsive layout (2-column on desktop, 1-column on mobile).
- **Comprehensive 10-Field Work Form:**
  1. **Employee Name** (Text, Required, name pattern validation)
  2. **Employee ID** (Text, Required, alphanumeric pattern e.g. `EMP001`)
  3. **Date of Work** (Date picker, Required)
  4. **Site of Work** (Text, Required)
  5. **Site Contact Person** (Text, Required)
  6. **Site Contact Person Contact Number** (Telephone/Mobile, Required, e.g. `+91 98765 43210`)
  7. **Type of Work** (Dropdown with industrial presets + custom category specification)
  8. **Work Description** (Multiline textarea, Required, real-time character counter)
  9. **Work Status** (Dropdown: `Not Started`, `In Progress`, `Completed`, `On Hold`)
  10. **Pending Work / Next Steps** (Multiline textarea, Optional)
- **Live Two-Way Google Sheets Integration:**
  - **Write (`POST`):** Sends verified report entries to a Google Apps Script Web App that appends rows to Google Sheets with automatic server timestamping.
  - **Read (`GET`):** Fetches submitted rows directly from Google Sheets to populate the dashboard table in real time.
  - **Concurrency Locking:** Employs Apps Script `LockService` to prevent simultaneous write race conditions.
  - **Zero Data Loss:** Includes browser local storage caching and automatic offline fallback.
- **Submission History Dashboard:**
  - **Summary Metrics Cards:** Live counters for Total Reports, In Progress, Completed, On Hold, and Not Started (clickable to filter table).
  - **Live Search:** Instant search by Employee Name, Employee ID, Site, or Work Type.
  - **Filters:** By Date of Work and Work Status with one-click filter reset.
  - **Sortable Table:** Sort by Timestamp, Employee, Date, Site, or Status. Latest submissions appear first by default.
  - **Full Details Modal:** Inspect all fields with formatted view, Print Report, and Copy to Clipboard.
- **Direct Excel Export:**
  - **Genuine Microsoft Excel (.xlsx):** Generates `.xlsx` workbooks with custom column widths using **SheetJS** (`xlsx`).
  - **Excel-Compatible CSV:** Encoded with a UTF-8 Byte Order Mark (`\uFEFF`) so international characters and names open cleanly in Excel without encoding dialogs.
  - **Filtered or Complete Export:** Choose whether to export filtered query results or all records in the database.

---

## 🏗️ Project Architecture

```
employee-work-management/
├── index.html                      # HTML5 entry with Plus Jakarta Sans & JetBrains Mono fonts
├── package.json                    # Project dependencies (React 19, Vite, Lucide-React, SheetJS)
├── vite.config.js                  # Vite configuration
├── .env.example                    # Environment variable template
├── .env                            # Active environment configuration
├── google-apps-script/
│   ├── Code.gs                     # Complete Google Apps Script backend (doPost, doGet, locks)
│   └── README.md                   # Dedicated Google Apps Script deployment instructions
├── src/
│   ├── main.jsx                    # React entrypoint
│   ├── App.jsx                     # Core application orchestrator, state, and tab routing
│   ├── components/
│   │   ├── Header.jsx              # Company branding, tabs, live system clock, connection pill
│   │   ├── Sidebar.jsx             # Collapsible navigation drawer with quick export and stats
│   │   ├── WorkReportForm.jsx      # 9-field validated form with loading state & reset handling
│   │   ├── WorkReportTable.jsx     # Responsive table with sortable columns & status badges
│   │   ├── SummaryCards.jsx        # 5 metrics cards with percentage distribution
│   │   ├── ReportDetailModal.jsx   # Detailed report viewer with print & copy actions
│   │   ├── Notification.jsx        # Accessible toast notification system
│   │   └── ApiConfigModal.jsx      # In-app Google Apps Script URL linker & connection tester
│   ├── pages/
│   │   ├── SubmitReport.jsx        # Centered card layout page for report submission
│   │   └── Dashboard.jsx           # Analytics, search/filter toolbar, and export controls
│   ├── services/
│   │   └── googleSheetsService.js  # HTTP service for POST/GET, ping test, and local cache
│   ├── utils/
│   │   ├── validation.js           # Form validation rules and field-level validators
│   │   └── exportToExcel.js        # SheetJS (.xlsx) and UTF-8 CSV exporter
│   └── styles/
│       ├── global.css              # Industrial CSS tokens, typography, resets, buttons
│       ├── form.css                # 2-column desktop / 1-column mobile grid, input error states
│       ├── dashboard.css           # Summary grid, search bar, table styles, responsive overflow
│       └── components.css          # Header, toast alerts, modals, and sidebar drawer
└── README.md                       # Complete documentation
```

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- **Node.js** (v18 or higher recommended; verified on Node v24)
- **npm** (v9 or higher)

### 2. Installation
Clone or navigate to the project directory:
```bash
cd employee-work-management
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```text
http://127.0.0.1:5173/
```

### 4. Production Build
To create an optimized production bundle:
```bash
npm run build
npm run preview
```

---

## 📊 Google Sheets Setup & Apps Script Deployment

Follow these steps to connect your React application to your Google Sheet:

### Step 1: Create the Google Sheet
1. Open [sheets.new](https://sheets.new) in your web browser.
2. Name the spreadsheet: **Employee Work Reports**.
3. The script will automatically format and label the columns.

### Step 2: Paste the Apps Script Backend
1. In the Google Sheets top menu, navigate to **Extensions → Apps Script**.
2. Delete any existing code in `Code.gs`.
3. Open [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) from this repository, copy all contents, and paste it into the editor.
4. Press `Ctrl + S` (or click the disk icon) to save.

### Step 3: Run One-Time Setup (Optional)
1. In the toolbar function dropdown, select `setupSheet`.
2. Click **Run**.
3. When prompted with **Authorization Required**:
   - Click **Review Permissions**.
   - Select your Google Account.
   - Click **Advanced** → **Go to Untitled project (unsafe)**.
   - Click **Allow**.
4. Check your Google Sheet: the header row with the 10 styled columns will be generated immediately.

### Step 4: Deploy as a Web App (Critical)
1. In the top right corner of the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon (**Select type**) and choose **Web app**.
3. Configure the deployment settings:
   - **Description:** `WorkLog Web App v1`
   - **Execute as:** `Me (your Google email)`
   - **Who has access:** `Anyone` *(Allows the frontend to submit data without OAuth credential exposure)*
4. Click **Deploy**.
5. Copy the generated **Web App URL** (e.g., `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 5: Connect URL to the React Application
You can connect the URL in either of two ways:
- **Directly in the Web Interface:** Click the **Google Sheets Sync** button in the header, paste your Web App URL, click **Test Connection** to verify ping latency, and click **Save Settings**.
- **In the `.env` file:** Set `VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec` and restart `npm run dev`.

---

## 📋 Google Sheet Column Structure

The Google Apps Script automatically maintains the exact 11-column structure:

| Col # | Column Header | Data Source | Example Value |
|---|---|---|---|
| 1 | **Timestamp** | Auto-generated by Apps Script | `2026-10-26 13:25:00` |
| 2 | **Employee Name** | Form field 1 | `Ravi Kumar` |
| 3 | **Employee ID** | Form field 2 | `EMP001` |
| 4 | **Date of Work** | Form field 3 | `2026-10-26` |
| 5 | **Site of Work** | Form field 4 | `ABC Manufacturing Plant` |
| 6 | **Site Contact Person** | Form field 5 | `Maintenance Supervisor` |
| 7 | **Site Contact Person Contact Number** | Form field 6 | `+91 98765 43210` |
| 8 | **Type of Work** | Form field 7 | `PLC Panel Installation` |
| 9 | **Work Description** | Form field 8 | `Panel wiring and I/O checking` |
| 10 | **Work Status** | Form field 9 | `In Progress` |
| 11 | **Pending Work / Next Steps** | Form field 10 | `Complete testing tomorrow` |

---

## 📝 Alternative: Google Forms Integration

If your organization prefers routing submissions through Google Forms:

1. Create a Google Form with questions matching the form fields:
   - Employee Name
   - Employee ID
   - Date of Work
   - Site of Work
   - Site Contact Person
   - Site Contact Person Contact Number
   - Type of Work
   - Work Description
   - Work Status
   - Pending Work / Next Steps
2. Link the Google Form responses to a Google Sheet (**Responses → Link to Sheets**).
3. In Google Forms, click the 3-dots menu → **Get pre-filled link**.
4. Type sample tokens into each question (e.g. `TEST_NAME`, `TEST_ID`) and click **Get link**.
5. The URL will look like:
   ```text
   https://docs.google.com/forms/d/e/FORM_ID/viewform?entry.123456=TEST_NAME&entry.234567=TEST_ID...
   ```
6. Replace `/viewform` with `/formResponse`.
7. Map each `entry.XXXXXXX` ID in `src/services/googleSheetsService.js` under `submitViaGoogleForms`.
8. *Note:* Google Forms is write-only; the Google Apps Script Web App method is recommended because it enables the Dashboard to read submissions back from Google Sheets.

---

## 📥 Direct Google Sheet Download

In addition to the application's built-in **Export to Excel (.xlsx)** and **Export CSV** buttons, you can download the entire Google Sheet at any time directly:
1. Open your linked Google Sheet in any browser.
2. Click **File → Download → Microsoft Excel (.xlsx)**.

---

## 🛡️ Security & Best Practices

- **Zero Credential Exposure:** No Google Cloud service account keys, client secrets, or private tokens are packaged into the frontend client.
- **Server-Side Validation:** The Google Apps Script verifies all required fields before committing rows.
- **Safe CORS Handling:** Requests are transmitted with `text/plain;charset=utf-8` payloads, allowing seamless cross-origin delivery to Apps Script redirects without preflight failures.
- **Concurrency Protection:** Multi-user submissions are serialized via `LockService.getScriptLock()` to eliminate row overwrites.

---

## 📄 License
MIT License. Built for industrial operations, maintenance logging, and facility management.
