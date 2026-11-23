/**
 * Google Apps Script (Code.gs) for Maama's Care Women Hostel Enquiry Form
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet (e.g., "Maama's Care Women Hostel Enquiries").
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any default code and paste this entire file into Code.gs.
 * 4. Click Deploy -> New deployment -> Select type: "Web app".
 * 5. Set "Execute as": Me, and "Who has access": Anyone.
 * 6. Click Deploy, authorize permissions, and copy the Web App URL.
 * 7. Paste the Web App URL into GOOGLE_SCRIPT_URL inside script.js.
 */

const SHEET_NAME = "Enquiries";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Auto-create sheet and formatted headers on first submission
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        "Timestamp (IST)",
        "Full Name",
        "Phone Number",
        "Profession",
        "Preferred Sharing",
        "AC Preference",
        "Preferred Area / Landmark",
        "Move-in Date",
        "Message",
        "Source",
        "Status",
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#FFE4EE")
        .setFontColor("#240E1B");
      sheet.setFrozenRows(1);
    }

    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const data = JSON.parse(rawBody);

    const timestampIST = Utilities.formatDate(
      new Date(),
      "Asia/Kolkata",
      "dd-MMM-yyyy hh:mm:ss a"
    );

    sheet.appendRow([
      timestampIST,
      sanitizeCell(data.name),
      sanitizeCell(data.phone),
      sanitizeCell(data.profession),
      sanitizeCell(data.sharingType),
      sanitizeCell(data.coolingPref || "AC Room"),
      sanitizeCell(data.preferredArea || "Not Specified"),
      sanitizeCell(data.moveInDate),
      sanitizeCell(data.message),
      sanitizeCell(data.source || "Maama's Care Women Hostel Website"),
      "New Enquiry",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", message: "Enquiry saved successfully." })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "ok",
      service: "Maama's Care Women Hostel Enquiry API",
      tagline: "Safe Stay... Happy Life...",
      location: "Near Chrompet & Tambaram, Chennai, Tamil Nadu",
      phone: "+91 78248 09809",
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Prevent spreadsheet formula injection (=, +, -, @)
 */
function sanitizeCell(value) {
  const str = String(value || "").trim();
  if (/^[=+\-@]/.test(str)) {
    return "'" + str;
  }
  return str;
}
