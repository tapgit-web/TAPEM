# Google Sheets & Google Apps Script Setup Guide

This guide walks you through connecting the Employee Work Details Management System to your Google Sheet in less than 3 minutes.

---

## Method 1: Google Apps Script Web App (Recommended - Full Two-Way Sync)

With this method, the React app will:
- **Write:** Submit new reports directly into the sheet using HTTP POST (`doPost`).
- **Read:** Fetch all records dynamically for the Dashboard using HTTP GET (`doGet`).

### Step 1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.new) in your browser.
2. Rename the sheet to **Employee Work Reports**.
3. (Optional) Rename the bottom tab to `Work_Reports` (if left as `Sheet1`, the script will automatically set it up).

### Step 2: Open the Apps Script Editor
1. In the Google Sheets top menu, click **Extensions** → **Apps Script**.
2. Erase any default code in the editor (`function myFunction() {}`).
3. Copy the entire contents of [`google-apps-script/Code.gs`](./Code.gs) and paste it into the editor.
4. Click the **Save** icon (diskette icon) or press `Ctrl + S`.

### Step 3: Run One-Time Setup (Optional)
1. In the function dropdown at the top, select `setupSheet`.
2. Click **Run**.
3. A dialog titled **Authorization Required** will appear:
   - Click **Review permissions**.
   - Select your Google account.
   - Click **Advanced** (at the bottom of the prompt).
   - Click **Go to Untitled project (unsafe)** (Google shows this warning for custom personal scripts).
   - Click **Allow**.
4. Check your Google Sheet: the header row with the 10 styled columns will now be created automatically!

### Step 4: Deploy as a Web App (Critical Step!)
1. In the top right corner of Apps Script, click the blue **Deploy** button → **New deployment**.
2. Click the gear icon (**Select type**) next to "Select type" and choose **Web app**.
3. Fill in the deployment details:
   - **Description:** `WorkLog Web App v1`
   - **Execute as:** `Me (your email address)` — *(Crucial: allows the script to write to your sheet)*
   - **Who has access:** `Anyone` — *(Crucial: allows the React application to submit without requiring users to log into your Google Account)*
4. Click **Deploy**.
5. Copy the **Web App URL** (it looks like `https://script.google.com/macros/s/AKfycbx.../exec`).

### Step 5: Configure the React App
You can configure the URL in two ways:

#### Option A: In the React UI (Instant, no restart needed)
1. Open the React application.
2. Click the **"Google Sheets Sync"** or **"Settings"** icon in the header.
3. Paste your Web App URL.
4. Click **"Test Connection"** → You should see a green checkmark `Connected`!
5. Click **"Save Settings"**.

#### Option B: In the `.env` file
1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and set:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
3. Restart your Vite development server (`npm run dev`).

---

## Method 2: Google Forms Alternative Integration

If your organization mandates using Google Forms instead of a custom Apps Script Web App:

### Step 1: Create the Google Form
Create a Google Form with the exact 10 questions:
1. **Employee Name** (Short answer, Required)
2. **Employee ID** (Short answer, Required)
3. **Date of Work** (Date, Required)
4. **Site of Work** (Short answer, Required)
5. **Site Contact Person** (Short answer, Required)
6. **Site Contact Person Contact Number** (Short answer, Required)
7. **Type of Work** (Dropdown or Short answer, Required)
8. **Work Description** (Paragraph, Required)
9. **Work Status** (Multiple choice: `Not Started`, `In Progress`, `Completed`, `On Hold`, Required)
10. **Pending Work / Next Steps** (Paragraph, Optional)

### Step 2: Connect Form to Google Sheet
1. Click the **Responses** tab in Google Forms.
2. Click **Link to Sheets** → Create a new spreadsheet.

### Step 3: Extract Form Action URL and Entry IDs
1. Click the 3 vertical dots at the top right of Google Forms → **Get pre-filled link**.
2. Type dummy values in each field (e.g. `TEST_NAME`, `TEST_ID`, etc.).
3. Click **Get link**, then copy the link.
4. The link will look like:
   ```text
   https://docs.google.com/forms/d/e/1FAIpQLSc.../viewform?entry.123456=TEST_NAME&entry.234567=TEST_ID...
   ```
5. Replace `/viewform?...` with `/formResponse`.
6. Map each `entry.XXXXXXX` ID to your form fields in `src/services/googleSheetsService.js` under the `submitViaGoogleForms` function.

> **Note on Google Forms limitations:** Google Forms submissions are one-way (submission only). You cannot read records back from Google Forms to populate the dashboard without either publishing the connected sheet to the web as CSV or using Apps Script `doGet`. The Google Apps Script Web App (Method 1) is therefore the recommended, complete two-way solution.

---

## Troubleshooting CORS & Redirects

Google Apps Script endpoints return an HTTP 302 redirect to `script.googleusercontent.com`. 
Our React service handles this using:
```javascript
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify(data),
  redirect: 'follow'
})
```
By sending the payload as `text/plain`, the browser avoids complex CORS preflight (`OPTIONS`) requirements that Google Apps Script does not natively support, while `Code.gs` parses `e.postData.contents` seamlessly!
