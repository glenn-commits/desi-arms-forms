// ============================================================
//  DESI ARMS — Google Apps Script
//  Receives form submissions and writes them to a Google Sheet
//
//  SETUP INSTRUCTIONS:
//  -------------------
//  1. Go to https://script.google.com and click "New project"
//  2. Delete any code in the editor and paste this entire file
//  3. Click the disk icon (or Ctrl+S) to save. Name the project
//     "Desi Arms Customer Requests"
//  4. Click "Deploy" > "New deployment"
//  5. Click the gear icon next to "Select type" and choose "Web app"
//  6. Set the following:
//       - Description: "Customer Request Form Handler"
//       - Execute as: "Me"
//       - Who has access: "Anyone"
//  7. Click "Deploy"
//  8. Google will ask you to authorize — click "Authorize access",
//     choose your Google account, and approve permissions
//  9. Copy the Web App URL that appears (it looks like:
//     https://script.google.com/macros/s/XXXXX/exec)
//  10. Paste that URL into the HTML form where it says:
//      const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
//
//  IMPORTANT: If updating from a previous version, delete the old
//  spreadsheet from Google Drive first so the new column structure
//  gets created fresh. Otherwise, data will go into the wrong columns.
// ============================================================

// Spreadsheet name — change if you like
const SPREADSHEET_NAME = "Desi Arms — Customer Requests";

// =====================================================
// EMAIL CONFIGURATION
// Replace with your actual email to receive notifications
// =====================================================
const NOTIFY_EMAIL = "you@desiarms.com";

// Sheet headers
const HEADERS = [
  "Timestamp",
  "Full Name",
  "Email",
  "Phone",
  "Company",
  "Request Type",
  "Customization Type",
  // Custom Build columns
  "Build Type",
  "Style",
  "Caliber",
  "Budget",
  // Cerakote / Engraving columns
  "Firearm Type",
  "Location",
  "Color(s)",
  "Type",
  // Common columns
  "Subject",
  "Description",
  "Preferred Contact",
  "Additional Comments",
  // Internal columns (set by your team)
  "Priority",
  "Department",
  "Status",
  "Assigned To",
  "Internal Notes"
];

/**
 * Handles POST requests from the HTML form
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();

    sheet.appendRow([
      new Date(),                        // Timestamp
      data.fullName || "",
      data.email || "",
      data.phone || "",
      data.company || "",
      data.requestType || "",
      data.customizationType || "",
      // Custom Build
      data.buildType || "",
      data.buildStyle || "",
      data.caliber || "",
      data.budget || "",
      // Cerakote / Engraving
      data.firearmType || "",
      data.location || "",
      data.colors || "",
      data.engravingType || "",
      // Common
      data.subject || "",
      data.description || "",
      data.contactMethod || "",
      data.comments || "",
      // Internal (blank — set by your team)
      "",                                // Priority
      "",                                // Department
      "New",                             // Status
      "",                                // Assigned To
      ""                                 // Internal Notes
    ]);

    // -------------------------------------------------------
    // NOTIFICATION EMAIL — sent to your team
    // -------------------------------------------------------
    try {
      var detailLines = "";
      if (data.customizationType === "Custom Build") {
        detailLines = "Build Type: " + (data.buildType || "N/A") + "\n" +
                      "Style: " + (data.buildStyle || "N/A") + "\n" +
                      "Caliber: " + (data.caliber || "N/A") + "\n" +
                      "Budget: " + (data.budget || "N/A") + "\n";
      } else if (data.customizationType === "Cerakote") {
        detailLines = "Firearm Type: " + (data.firearmType || "N/A") + "\n" +
                      "Location: " + (data.location || "N/A") + "\n" +
                      "Color(s): " + (data.colors || "N/A") + "\n";
      } else if (data.customizationType === "Engraving") {
        detailLines = "Firearm Type: " + (data.firearmType || "N/A") + "\n" +
                      "Location: " + (data.location || "N/A") + "\n" +
                      "Type: " + (data.engravingType || "N/A") + "\n";
      }

      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: "New Customer Request: " + (data.subject || "No Subject"),
        body: "A new customer request has been submitted.\n\n" +
              "From: " + data.fullName + " (" + data.email + ")\n" +
              "Phone: " + (data.phone || "N/A") + "\n" +
              "Company: " + (data.company || "N/A") + "\n" +
              "Request Type: " + data.requestType + "\n" +
              (data.customizationType ? "Customization: " + data.customizationType + "\n" : "") +
              detailLines +
              "Preferred Contact: " + (data.contactMethod || "Email") + "\n\n" +
              "Subject: " + data.subject + "\n" +
              "Description:\n" + data.description + "\n" +
              (data.comments ? "\nAdditional Comments:\n" + data.comments + "\n" : "") +
              "\n---\nView all requests in Google Sheets"
      });
    } catch (emailError) {
      Logger.log("Notification email error: " + emailError.toString());
    }

    // -------------------------------------------------------
    // CONFIRMATION EMAIL — sent to the customer
    // -------------------------------------------------------
    try {
      if (data.email) {
        var custDetailLines = "";
        if (data.customizationType === "Custom Build") {
          custDetailLines = "Build Type: " + (data.buildType || "") + "\n" +
                            "Style: " + (data.buildStyle || "") + "\n" +
                            "Caliber: " + (data.caliber || "") + "\n" +
                            "Budget: " + (data.budget || "") + "\n";
        } else if (data.customizationType === "Cerakote") {
          custDetailLines = "Firearm Type: " + (data.firearmType || "") + "\n" +
                            "Location: " + (data.location || "") + "\n" +
                            "Color(s): " + (data.colors || "") + "\n";
        } else if (data.customizationType === "Engraving") {
          custDetailLines = "Firearm Type: " + (data.firearmType || "") + "\n" +
                            "Location: " + (data.location || "") + "\n" +
                            "Type: " + (data.engravingType || "") + "\n";
        }

        MailApp.sendEmail({
          to: data.email,
          subject: "Desi Arms — We Received Your Request: " + (data.subject || ""),
          body: "Hi " + data.fullName + ",\n\n" +
                "Thank you for reaching out to Desi Arms! We've received your request and our team will review it shortly.\n\n" +
                "Here's a summary of what you submitted:\n\n" +
                "Request Type: " + data.requestType + "\n" +
                (data.customizationType ? "Customization: " + data.customizationType + "\n" : "") +
                custDetailLines +
                "Subject: " + data.subject + "\n\n" +
                "We'll be in touch via your preferred contact method (" + (data.contactMethod || "Email") + ").\n\n" +
                "If you have any urgent questions in the meantime, feel free to contact us directly.\n\n" +
                "Thank you,\n" +
                "The Desi Arms Team"
        });
      }
    } catch (confirmError) {
      Logger.log("Confirmation email error: " + confirmError.toString());
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (for testing in browser)
 */
function doGet(e) {
  return ContentService
    .createTextOutput("Desi Arms form handler is running. Use POST to submit data.")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Finds existing spreadsheet or creates a new one with headers & formatting
 */
function getOrCreateSheet() {
  var files = DriveApp.getFilesByName(SPREADSHEET_NAME);

  if (files.hasNext()) {
    var file = files.next();
    return SpreadsheetApp.open(file).getSheets()[0];
  }

  // Create new spreadsheet
  var ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  var sheet = ss.getSheets()[0];
  sheet.setName("Requests");

  // Add headers
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1a2a3a");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontFamily("Arial");

  // Set column widths for readability
  var widths = [
    160,  // A: Timestamp
    150,  // B: Full Name
    200,  // C: Email
    130,  // D: Phone
    150,  // E: Company
    180,  // F: Request Type
    160,  // G: Customization Type
    120,  // H: Build Type
    100,  // I: Style
    120,  // J: Caliber
    140,  // K: Budget
    130,  // L: Firearm Type
    130,  // M: Location
    150,  // N: Color(s)
    100,  // O: Type
    200,  // P: Subject
    300,  // Q: Description
    140,  // R: Preferred Contact
    250,  // S: Additional Comments
    100,  // T: Priority
    140,  // U: Department
    100,  // V: Status
    130,  // W: Assigned To
    250   // X: Internal Notes
  ];
  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }

  // Freeze header row
  sheet.setFrozenRows(1);

  // Data validations for internal columns
  var priorityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Low", "Medium", "High", "Urgent"])
    .setAllowInvalid(true).build();
  sheet.getRange("T2:T1000").setDataValidation(priorityRule);

  var deptRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Sales", "Customer Service", "Technical Support", "Billing", "Gunsmithing", "Other"])
    .setAllowInvalid(true).build();
  sheet.getRange("U2:U1000").setDataValidation(deptRule);

  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["New", "In Progress", "Waiting on Customer", "Resolved", "Closed"])
    .setAllowInvalid(false).build();
  sheet.getRange("V2:V1000").setDataValidation(statusRule);

  return sheet;
}
