// ============================================
// APPS SCRIPT BACKEND - Grit Challenge Functions
// ============================================
// These functions should be added to the existing Apps Script project
// that serves the Strength Portal API endpoint:
// https://script.google.com/macros/s/AKfycbzoyT7zqrOhEf3LAsflbRB73OO2-RaHdnCz5f676xuO9Odc6wFUQpo0aE3XX6Qt-Bk0/exec
//
// The existing doGet/doPost handlers need to be updated to route
// the new actions: getGritChallenge, saveGritChallenge

// ============================================
// SHEET CONFIGURATION
// ============================================
const GRIT_SHEET_NAME = 'GritChallenges';

// Expected columns in GritChallenges sheet:
// A: Email
// B: ChallengeJSON (stringified challenge object)
// C: LastUpdated (timestamp)
// D: Status (active/complete/pending)

function getGritSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(GRIT_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(GRIT_SHEET_NAME);
    sheet.appendRow(['Email', 'ChallengeJSON', 'LastUpdated', 'Status']);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  return sheet;
}

// ============================================
// GET: Load a student's Grit Challenge
// ============================================
// Called via: ?action=getGritChallenge&email=student@fis.edu
function handleGetGritChallenge(email) {
  try {
    const sheet = getGritSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === email.toLowerCase()) {
        const challengeJSON = data[i][1];
        if (challengeJSON) {
          const challenge = JSON.parse(challengeJSON);
          return {
            success: true,
            challenge: challenge
          };
        }
      }
    }

    // No challenge found for this student
    return {
      success: true,
      challenge: null
    };
  } catch (error) {
    return {
      success: false,
      error: 'Error loading Grit challenge: ' + error.message
    };
  }
}

// ============================================
// POST: Save/Update a student's Grit Challenge
// ============================================
// Called via POST with body:
// { action: 'saveGritChallenge', email: 'student@fis.edu', challenge: {...} }
function handleSaveGritChallenge(email, challenge) {
  try {
    const sheet = getGritSheet();
    const data = sheet.getDataRange().getValues();
    const challengeJSON = JSON.stringify(challenge);
    const now = new Date().toISOString();
    const status = challenge.status || 'active';

    // Look for existing row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === email.toLowerCase()) {
        // Update existing row
        sheet.getRange(i + 1, 2).setValue(challengeJSON);
        sheet.getRange(i + 1, 3).setValue(now);
        sheet.getRange(i + 1, 4).setValue(status);
        return { success: true, updated: true };
      }
    }

    // New row
    sheet.appendRow([email, challengeJSON, now, status]);
    return { success: true, updated: false };
  } catch (error) {
    return {
      success: false,
      error: 'Error saving Grit challenge: ' + error.message
    };
  }
}

// ============================================
// GET: Load all Grit Challenges (for admin)
// ============================================
// Called via: ?action=getGritAdminData
function handleGetGritAdminData() {
  try {
    const sheet = getGritSheet();
    const data = sheet.getDataRange().getValues();
    const challenges = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][1]) {
        try {
          const challenge = JSON.parse(data[i][1]);
          challenges.push({
            email: data[i][0],
            challenge: challenge,
            lastUpdated: data[i][2],
            status: data[i][3]
          });
        } catch (e) {
          // Skip malformed rows
        }
      }
    }

    return {
      success: true,
      challenges: challenges
    };
  } catch (error) {
    return {
      success: false,
      error: 'Error loading admin data: ' + error.message
    };
  }
}

// ============================================
// ROUTING - Add these cases to existing doGet/doPost
// ============================================

// Add to existing doGet(e) function:
//
//   case 'getGritChallenge':
//     result = handleGetGritChallenge(e.parameter.email);
//     break;
//   case 'getGritAdminData':
//     result = handleGetGritAdminData();
//     break;

// Add to existing doPost(e) function:
//
//   case 'saveGritChallenge':
//     result = handleSaveGritChallenge(payload.email, payload.challenge);
//     break;

// ============================================
// STANDALONE doGet/doPost (if deploying separately)
// ============================================
// If these are added to the EXISTING Apps Script, only the handler
// functions and routing cases above are needed. The doGet/doPost
// below are provided as reference for what the routing looks like.

/*
function doGet(e) {
  const action = e.parameter.action;
  let result;

  switch (action) {
    case 'getGritChallenge':
      result = handleGetGritChallenge(e.parameter.email);
      break;
    case 'getGritAdminData':
      result = handleGetGritAdminData();
      break;
    default:
      result = { success: false, error: 'Unknown action: ' + action };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid JSON payload'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  let result;
  switch (payload.action) {
    case 'saveGritChallenge':
      result = handleSaveGritChallenge(payload.email, payload.challenge);
      break;
    default:
      result = { success: false, error: 'Unknown action: ' + payload.action };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
*/
