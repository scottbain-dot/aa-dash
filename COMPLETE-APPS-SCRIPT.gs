// ========================================
// ATHLETE ACADEMY - APPS SCRIPT FOR TAB-BASED DATA
// WITH WORKOUT SYSTEM + ADMIN PANEL + GRIT CHALLENGE
// ========================================

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = e.parameter.action;

    // ===== ADMIN PANEL ACTIONS =====
    if (action === 'getAllStudents') {
      return getAllStudents(ss);
    }

    if (action === 'getConfig') {
      return getConfig(ss, e.parameter.key);
    }

    if (action === 'setConfig') {
      return setConfig(ss, e.parameter.key, e.parameter.value);
    }

    if (action === 'updateStudent') {
      const athleteId = e.parameter.athleteId;
      const updates = JSON.parse(e.parameter.updates || '{}');
      return updateStudent(athleteId, updates);
    }

    // ===== WORKOUT SYSTEM ACTIONS =====
    if (action === 'saveWorkout') {
      const email = e.parameter.email;
      const sessionType = e.parameter.sessionType;
      const exercisesCompleted = e.parameter.exercisesCompleted;
      const notes = e.parameter.notes || '';
      const durationMinutes = parseInt(e.parameter.durationMinutes) || 45;
      const result = saveWorkout(email, sessionType, exercisesCompleted, notes, durationMinutes);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getLastSession') {
      const athleteId = e.parameter.athleteId || e.parameter.email;
      const lastSession = getLastSession(athleteId);
      return ContentService.createTextOutput(JSON.stringify(lastSession))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getLastSessionByType') {
      const athleteId = e.parameter.athleteId || e.parameter.email;
      const sessionType = e.parameter.sessionType;
      const lastSession = getLastSessionByType(athleteId, sessionType);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        lastSession: lastSession
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getWorkoutHistory') {
      const athleteId = e.parameter.athleteId || e.parameter.email;
      const limit = parseInt(e.parameter.limit) || 10;
      const history = getWorkoutHistory(athleteId, limit);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        history: history
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getNextWeights') {
      const athleteId = e.parameter.athleteId || e.parameter.email;
      const weights = getNextWeights(athleteId);
      return ContentService.createTextOutput(JSON.stringify(weights))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getAthleteData') {
      const email = e.parameter.email;
      return handleStudentRequest(ss, email);
    }

    // ===== GRIT CHALLENGE ACTIONS =====
    if (action === 'getGritChallenge') {
      var gritResult = handleGetGritChallenge(ss, e.parameter.email);
      return ContentService.createTextOutput(JSON.stringify(gritResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getGritAdminData') {
      var gritAdminResult = handleGetGritAdminData(ss);
      return ContentService.createTextOutput(JSON.stringify(gritAdminResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getSessionPlanning') {
      var sessionNum = parseInt(e.parameter.session) || 1;
      var planningResult = handleGetSessionPlanning(ss, sessionNum);
      return ContentService.createTextOutput(JSON.stringify(planningResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getObservations') {
      var obsSession = e.parameter.session ? parseInt(e.parameter.session) : null;
      var obsResult = handleGetObservations(ss, obsSession);
      return ContentService.createTextOutput(JSON.stringify(obsResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== EXISTING DASHBOARD LOGIC =====
    if (e.parameter.admin === 'true') {
      return handleAdminRequest(ss);
    }

    return handleStudentRequest(ss, e.parameter.email);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      stack: error.stack,
      authenticated: false
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// doPost - Handle POST requests
// ========================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'saveWorkout') {
      var result = saveWorkout(
        data.email,
        data.sessionType,
        data.exercisesCompleted,
        data.notes || '',
        data.duration || 45,
        data.rpe || null
      );
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'updateStudent') {
      return updateStudent(data.athleteId, data.updates);
    }

    // ===== GRIT CHALLENGE SAVE =====
    if (data.action === 'saveGritChallenge') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var gritResult = handleSaveGritChallenge(ss, data.email, data.challenge);
      return ContentService.createTextOutput(JSON.stringify(gritResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== COACH FEEDBACK SAVE =====
    if (data.action === 'saveCoachFeedback') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var feedbackResult = handleSaveCoachFeedback(ss, data.email, data.sessionNumber, data.feedback, data.blockingMessage);
      return ContentService.createTextOutput(JSON.stringify(feedbackResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== PSYCH SCORES UPDATE =====
    if (data.action === 'updatePsychScores') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var psychResult = handleUpdatePsychScores(ss, data.email, data.mindset, data.mentalToughness, data.grit);
      return ContentService.createTextOutput(JSON.stringify(psychResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== AI COACHING INSIGHTS =====
    if (data.action === 'getAICoachingInsights') {
      var aiResult = handleGetAICoachingInsights(data.data);
      return ContentService.createTextOutput(JSON.stringify(aiResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== AI HERO INSIGHT (single-sentence trajectory line) =====
    if (data.action === 'getHeroInsight') {
      var heroResult = handleGetHeroInsight(data.data);
      return ContentService.createTextOutput(JSON.stringify(heroResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== SAVE NOMINATION =====
    if (data.action === 'saveNomination') {
      var nomResult = handleSaveNomination(data);
      return ContentService.createTextOutput(JSON.stringify(nomResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== SAVE SESSION OBSERVATION =====
    if (data.action === 'saveObservation') {
      var ssObs = SpreadsheetApp.getActiveSpreadsheet();
      var obsSaveResult = handleSaveObservation(ssObs, data);
      return ContentService.createTextOutput(JSON.stringify(obsSaveResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.athleteId && data.updates) {
      return updateStudent(data.athleteId, data.updates);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown POST action'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// GRIT CHALLENGE FUNCTIONS
// Uses existing Grit_Journal tab with added columns:
//   Challenge_JSON, Challenge_Status, Challenge_Updated
// ========================================

// Helper: look up Athlete_ID from email
function lookupAthleteIdByEmail(ss, email) {
  var athletesSheet = ss.getSheetByName('Athletes');
  if (!athletesSheet) return null;

  var data = athletesSheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol = headers.indexOf('Email');
  var idCol = headers.indexOf('Athlete_ID');
  if (emailCol === -1 || idCol === -1) return null;

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol] && data[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      return data[i][idCol];
    }
  }
  return null;
}

// Ensure Grit_Journal has the challenge columns
function ensureGritChallengeColumns(ss) {
  var sheet = ss.getSheetByName('Grit_Journal');
  if (!sheet) {
    // Create the sheet with all needed columns
    sheet = ss.insertSheet('Grit_Journal');
    sheet.getRange('A1:F1').setValues([['Athlete_ID', 'Date', 'Grit_Assignment', 'Challenge_JSON', 'Challenge_Status', 'Challenge_Updated']]);
    sheet.getRange('1:1').setFontWeight('bold');
    return sheet;
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Add missing columns
  var needed = ['Challenge_JSON', 'Challenge_Status', 'Challenge_Updated'];
  for (var n = 0; n < needed.length; n++) {
    if (headers.indexOf(needed[n]) === -1) {
      var newCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, newCol).setValue(needed[n]);
    }
  }

  return sheet;
}

// GET: Load a student's Grit Challenge
// Called via: ?action=getGritChallenge&email=student@fis.edu
function handleGetGritChallenge(ss, email) {
  try {
    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) {
      return { success: true, challenge: null };
    }

    var sheet = ensureGritChallengeColumns(ss);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('Athlete_ID');
    var jsonCol = headers.indexOf('Challenge_JSON');

    if (idCol === -1 || jsonCol === -1) {
      return { success: true, challenge: null };
    }

    // Find the row with challenge data for this athlete
    // Search from bottom up to get most recent if multiple rows
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][idCol]).trim() == String(athleteId).trim()) {
        var challengeJSON = data[i][jsonCol];
        if (challengeJSON && String(challengeJSON).trim() !== '') {
          try {
            var challenge = JSON.parse(challengeJSON);
            return { success: true, challenge: challenge };
          } catch (parseErr) {
            // Malformed JSON, skip
          }
        }
      }
    }

    return { success: true, challenge: null };

  } catch (error) {
    return { success: false, error: 'Error loading Grit challenge: ' + error.message };
  }
}

// POST: Save/Update a student's Grit Challenge
// Called via POST with body:
// { action: 'saveGritChallenge', email: 'student@fis.edu', challenge: {...} }
function handleSaveGritChallenge(ss, email, challenge) {
  try {
    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) {
      return { success: false, error: 'No athlete found for email: ' + email };
    }

    var sheet = ensureGritChallengeColumns(ss);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('Athlete_ID');
    var jsonCol = headers.indexOf('Challenge_JSON');
    var statusCol = headers.indexOf('Challenge_Status');
    var updatedCol = headers.indexOf('Challenge_Updated');

    var challengeJSON = JSON.stringify(challenge);
    var now = new Date();
    var status = challenge.status || 'active';

    // Look for existing row with challenge data for this athlete
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][idCol]).trim() == String(athleteId).trim()) {
        var existingJSON = data[i][jsonCol];
        if (existingJSON && String(existingJSON).trim() !== '') {
          // Update this row
          sheet.getRange(i + 1, jsonCol + 1).setValue(challengeJSON);
          if (statusCol >= 0) sheet.getRange(i + 1, statusCol + 1).setValue(status);
          if (updatedCol >= 0) sheet.getRange(i + 1, updatedCol + 1).setValue(now);
          return { success: true, updated: true };
        }
      }
    }

    // No existing challenge row — find any row for this athlete to update,
    // or create a new row
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() == String(athleteId).trim()) {
        // Update the first row found for this athlete
        sheet.getRange(i + 1, jsonCol + 1).setValue(challengeJSON);
        if (statusCol >= 0) sheet.getRange(i + 1, statusCol + 1).setValue(status);
        if (updatedCol >= 0) sheet.getRange(i + 1, updatedCol + 1).setValue(now);
        return { success: true, updated: true };
      }
    }

    // No row at all for this athlete — create new
    var newRow = [];
    for (var h = 0; h < headers.length; h++) {
      if (headers[h] === 'Athlete_ID') newRow.push(athleteId);
      else if (headers[h] === 'Date') newRow.push(now);
      else if (headers[h] === 'Challenge_JSON') newRow.push(challengeJSON);
      else if (headers[h] === 'Challenge_Status') newRow.push(status);
      else if (headers[h] === 'Challenge_Updated') newRow.push(now);
      else newRow.push('');
    }
    sheet.appendRow(newRow);
    return { success: true, updated: false };

  } catch (error) {
    return { success: false, error: 'Error saving Grit challenge: ' + error.message };
  }
}

// GET: Load all Grit Challenges (for admin panel)
// Called via: ?action=getGritAdminData
function handleGetGritAdminData(ss) {
  try {
    var sheet = ensureGritChallengeColumns(ss);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('Athlete_ID');
    var jsonCol = headers.indexOf('Challenge_JSON');
    var statusCol = headers.indexOf('Challenge_Status');
    var updatedCol = headers.indexOf('Challenge_Updated');

    // Also load athlete names/emails for display
    var athletesSheet = ss.getSheetByName('Athletes');
    var athleteMap = {};
    if (athletesSheet) {
      var aData = athletesSheet.getDataRange().getValues();
      var aHeaders = aData[0];
      var aIdCol = aHeaders.indexOf('Athlete_ID');
      var aEmailCol = aHeaders.indexOf('Email');
      var aNameCol = aHeaders.indexOf('Name');
      var aFirstCol = aHeaders.indexOf('First_Name');
      var aLastCol = aHeaders.indexOf('Last_Name');
      for (var a = 1; a < aData.length; a++) {
        var aid = aData[a][aIdCol];
        if (!aid) continue;
        var aName = '';
        if (aNameCol >= 0 && aData[a][aNameCol]) {
          aName = aData[a][aNameCol];
        } else if (aFirstCol >= 0) {
          aName = aData[a][aFirstCol] + ' ' + (aLastCol >= 0 ? aData[a][aLastCol] || '' : '');
        }
        athleteMap[String(aid).trim()] = {
          name: aName.trim(),
          email: aEmailCol >= 0 ? aData[a][aEmailCol] : ''
        };
      }
    }

    var challenges = [];
    // Track which athletes we've already added (use last row = most recent)
    var seen = {};

    for (var i = data.length - 1; i >= 1; i--) {
      var rowId = String(data[i][idCol] || '').trim();
      if (!rowId || seen[rowId]) continue;

      var jsonVal = jsonCol >= 0 ? data[i][jsonCol] : '';
      if (!jsonVal || String(jsonVal).trim() === '') continue;

      try {
        var challenge = JSON.parse(jsonVal);
        var athleteInfo = athleteMap[rowId] || {};
        challenges.push({
          athleteId: rowId,
          name: athleteInfo.name || '',
          email: athleteInfo.email || '',
          challenge: challenge,
          status: statusCol >= 0 ? data[i][statusCol] : '',
          lastUpdated: updatedCol >= 0 ? data[i][updatedCol] : ''
        });
        seen[rowId] = true;
      } catch (parseErr) {
        // Skip malformed
      }
    }

    return { success: true, challenges: challenges };

  } catch (error) {
    return { success: false, error: 'Error loading admin data: ' + error.message };
  }
}


// ========================================
// COACH FEEDBACK FUNCTION
// POST: { action: 'saveCoachFeedback', email, sessionNumber, feedback, blockingMessage }
// Saves coach feedback into the session object within Challenge_JSON
// ========================================

function handleSaveCoachFeedback(ss, email, sessionNumber, feedback, blockingMessage) {
  try {
    if (!email) {
      return { success: false, error: 'No email provided' };
    }
    if (!sessionNumber || sessionNumber < 1 || sessionNumber > 8) {
      return { success: false, error: 'Session number must be 1–8' };
    }
    if (feedback === undefined || feedback === null) {
      return { success: false, error: 'No feedback provided' };
    }

    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) {
      return { success: false, error: 'No athlete found for email: ' + email };
    }

    var sheet = ensureGritChallengeColumns(ss);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('Athlete_ID');
    var jsonCol = headers.indexOf('Challenge_JSON');

    if (idCol === -1 || jsonCol === -1) {
      return { success: false, error: 'Required columns not found in Grit_Journal' };
    }

    // Find the most recent row for this athlete
    var targetRow = -1;
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][idCol]).trim() == String(athleteId).trim()) {
        targetRow = i;
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, error: 'No Grit Journal row found for this athlete' };
    }

    var challengeJSON = data[targetRow][jsonCol];
    var challenge;
    if (challengeJSON && String(challengeJSON).trim() !== '') {
      try {
        challenge = JSON.parse(challengeJSON);
      } catch (parseErr) {
        return { success: false, error: 'Could not parse existing Challenge_JSON' };
      }
    } else {
      // No challenge data yet — create minimal structure
      challenge = { sessions: [] };
    }

    // Ensure sessions array exists
    if (!challenge.sessions) {
      challenge.sessions = [];
    }

    var idx = sessionNumber - 1;

    // Ensure the sessions array is long enough
    while (challenge.sessions.length <= idx) {
      challenge.sessions.push(null);
    }

    if (challenge.sessions[idx] && typeof challenge.sessions[idx] === 'object') {
      // Session object exists — add feedback fields
      challenge.sessions[idx].coachFeedback = feedback;
      challenge.sessions[idx].requiresPlanningFirst = !!blockingMessage;
    } else {
      // Session doesn't exist yet — create minimal object
      challenge.sessions[idx] = {
        coachFeedback: feedback,
        requiresPlanningFirst: !!blockingMessage
      };
    }

    // Write updated challenge back
    var updatedJSON = JSON.stringify(challenge);
    sheet.getRange(targetRow + 1, jsonCol + 1).setValue(updatedJSON);

    // Update timestamp if column exists
    var updatedCol = headers.indexOf('Challenge_Updated');
    if (updatedCol >= 0) {
      sheet.getRange(targetRow + 1, updatedCol + 1).setValue(new Date());
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: 'Error saving coach feedback: ' + error.message };
  }
}

// ========================================
// SESSION PLANNING FUNCTION
// GET: ?action=getSessionPlanning&session=N
// Returns all students with active Grit challenges and their session N data
// ========================================

function handleGetSessionPlanning(ss, sessionNumber) {
  try {
    if (!sessionNumber || sessionNumber < 1 || sessionNumber > 8) {
      return { success: false, error: 'Session number must be 1–8' };
    }

    var sheet = ensureGritChallengeColumns(ss);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('Athlete_ID');
    var jsonCol = headers.indexOf('Challenge_JSON');
    var statusCol = headers.indexOf('Challenge_Status');

    if (idCol === -1 || jsonCol === -1) {
      return { success: false, error: 'Required columns not found in Grit_Journal' };
    }

    // Build athlete lookup map (name + email)
    var athletesSheet = ss.getSheetByName('Athletes');
    var athleteMap = {};
    if (athletesSheet) {
      var aData = athletesSheet.getDataRange().getValues();
      var aHeaders = aData[0];
      var aIdCol = aHeaders.indexOf('Athlete_ID');
      var aEmailCol = aHeaders.indexOf('Email');
      var aNameCol = aHeaders.indexOf('Name');
      var aFirstCol = aHeaders.indexOf('First_Name');
      var aLastCol = aHeaders.indexOf('Last_Name');
      for (var a = 1; a < aData.length; a++) {
        var aid = aData[a][aIdCol];
        if (!aid) continue;
        var aName = '';
        if (aNameCol >= 0 && aData[a][aNameCol]) {
          aName = aData[a][aNameCol];
        } else if (aFirstCol >= 0) {
          aName = aData[a][aFirstCol] + ' ' + (aLastCol >= 0 ? aData[a][aLastCol] || '' : '');
        }
        athleteMap[String(aid).trim()] = {
          name: aName.trim(),
          email: aEmailCol >= 0 ? aData[a][aEmailCol] : ''
        };
      }
    }

    var students = [];
    var seen = {};
    var idx = sessionNumber - 1;

    // Iterate from bottom up to get most recent row per athlete
    for (var i = data.length - 1; i >= 1; i--) {
      var rowId = String(data[i][idCol] || '').trim();
      if (!rowId || seen[rowId]) continue;

      var jsonVal = jsonCol >= 0 ? data[i][jsonCol] : '';
      if (!jsonVal || String(jsonVal).trim() === '') continue;

      // Skip non-active challenges
      if (statusCol >= 0 && data[i][statusCol] && String(data[i][statusCol]).toLowerCase() === 'inactive') continue;

      try {
        var challenge = JSON.parse(jsonVal);
        var athleteInfo = athleteMap[rowId] || {};

        var sessionData = null;
        var hasPlanned = false;

        if (challenge.sessions && challenge.sessions.length > idx && challenge.sessions[idx]) {
          sessionData = challenge.sessions[idx];
          // hasPlanned is true if the session has a non-empty plan field
          hasPlanned = !!(sessionData.plan && String(sessionData.plan).trim() !== '');
        }

        students.push({
          name: athleteInfo.name || '',
          email: athleteInfo.email || '',
          challengeType: challenge.type || challenge.challengeType || '',
          challengeFocus: challenge.focus || challenge.challengeFocus || '',
          session: sessionData,
          hasPlanned: hasPlanned
        });

        seen[rowId] = true;
      } catch (parseErr) {
        // Skip malformed JSON
      }
    }

    return { success: true, session: sessionNumber, students: students };

  } catch (error) {
    return { success: false, error: 'Error loading session planning: ' + error.message };
  }
}

// ========================================
// PSYCH SCORES UPDATE
// POST: { action: 'updatePsychScores', email, mindset, mentalToughness, grit }
// Writes Mindset, Mental_Toughness, Grit to Psych_Assessments
// ========================================

function handleUpdatePsychScores(ss, email, mindset, mentalToughness, grit) {
  try {
    if (!email) {
      return { success: false, error: 'No email provided' };
    }

    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) {
      return { success: false, error: 'No athlete found for email: ' + email };
    }

    var sheet = ss.getSheetByName('Psych_Assessments');
    if (!sheet) {
      return { success: false, error: 'Psych_Assessments sheet not found' };
    }

    // Validate scores are 1–5
    function validateScore(val) {
      var n = parseInt(val);
      if (isNaN(n) || n < 1 || n > 5) return null;
      return n;
    }

    var scores = {};
    if (mindset !== undefined && mindset !== null) {
      var v = validateScore(mindset);
      if (v === null) return { success: false, error: 'Mindset must be 1–5' };
      scores['Mindset'] = v;
    }
    if (mentalToughness !== undefined && mentalToughness !== null) {
      var v = validateScore(mentalToughness);
      if (v === null) return { success: false, error: 'Mental Toughness must be 1–5' };
      scores['Mental_Toughness'] = v;
    }
    if (grit !== undefined && grit !== null) {
      var v = validateScore(grit);
      if (v === null) return { success: false, error: 'Grit must be 1–5' };
      scores['Grit'] = v;
    }

    if (Object.keys(scores).length === 0) {
      return { success: false, error: 'No scores provided' };
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('Athlete_ID');
    var dateCol = headers.indexOf('Date');

    if (idCol === -1) {
      return { success: false, error: 'Athlete_ID column not found in Psych_Assessments' };
    }

    // Today's date string for comparison
    var today = new Date();
    var todayStr = Utilities.formatDate(today, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');

    // Find the most recent row for this athlete
    var mostRecentRow = -1;
    var mostRecentDate = null;
    var isTodayRow = false;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() == String(athleteId).trim()) {
        var rowDate = null;
        if (dateCol >= 0 && data[i][dateCol]) {
          try {
            rowDate = new Date(data[i][dateCol]);
            if (isNaN(rowDate.getTime())) rowDate = null;
          } catch (e) {
            rowDate = null;
          }
        }

        if (rowDate) {
          var rowDateStr = Utilities.formatDate(rowDate, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
          if (rowDateStr === todayStr) {
            // Found a row for today — update it
            mostRecentRow = i + 1;
            isTodayRow = true;
            break;
          }
          if (!mostRecentDate || rowDate > mostRecentDate) {
            mostRecentDate = rowDate;
            mostRecentRow = i + 1;
          }
        } else if (mostRecentRow === -1) {
          mostRecentRow = i + 1;
        }
      }
    }

    if (isTodayRow && mostRecentRow > 0) {
      // Update existing today row — only write the provided fields
      for (var field in scores) {
        var colIdx = headers.indexOf(field);
        if (colIdx >= 0) {
          sheet.getRange(mostRecentRow, colIdx + 1).setValue(scores[field]);
        }
      }
      return { success: true };
    }

    // Append a new row for today
    var newRow = [];
    for (var h = 0; h < headers.length; h++) {
      if (headers[h] === 'Athlete_ID') {
        newRow.push(athleteId);
      } else if (headers[h] === 'Date') {
        newRow.push(today);
      } else if (scores[headers[h]] !== undefined) {
        newRow.push(scores[headers[h]]);
      } else {
        newRow.push('');
      }
    }
    sheet.appendRow(newRow);

    return { success: true };

  } catch (error) {
    return { success: false, error: 'Error updating psych scores: ' + error.message };
  }
}

// ========================================
// ADMIN PANEL FUNCTIONS
// ========================================

// Get all students with their strength data + session counts from Workout_Logs
function getAllStudents(ss) {
  try {
    const athletesSheet = ss.getSheetByName('Athletes');
    const strengthSheet = ss.getSheetByName('Strength');
    const logsSheet = ss.getSheetByName('Workout_Logs');

    if (!athletesSheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Athletes sheet not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Get athletes data
    const athletesData = athletesSheet.getDataRange().getValues();
    const athletesHeaders = athletesData[0];

    // Get strength data if sheet exists
    var strengthData = [];
    var strengthHeaders = [];
    if (strengthSheet) {
      strengthData = strengthSheet.getDataRange().getValues();
      strengthHeaders = strengthData[0];
    }

    // Count sessions per athlete from Workout_Logs
    var sessionCounts = {};
    var lastSessionDates = {};
    if (logsSheet && logsSheet.getLastRow() > 1) {
      var logsData = logsSheet.getDataRange().getValues();
      for (var i = 1; i < logsData.length; i++) {
        var logId = String(logsData[i][0]).trim();
        if (!logId) continue;
        if (!sessionCounts[logId]) {
          sessionCounts[logId] = 0;
          lastSessionDates[logId] = null;
        }
        sessionCounts[logId]++;
        try {
          var logDate = new Date(logsData[i][1]);
          if (!isNaN(logDate.getTime())) {
            if (!lastSessionDates[logId] || logDate > lastSessionDates[logId]) {
              lastSessionDates[logId] = logDate;
            }
          }
        } catch(e) {}
      }
    }

    // Build student list
    var students = [];
    for (var i = 1; i < athletesData.length; i++) {
      var row = athletesData[i];
      var athleteId = row[athletesHeaders.indexOf('Athlete_ID')];
      if (!athleteId) continue;

      var nameCol = athletesHeaders.indexOf('Name');
      var firstNameCol = athletesHeaders.indexOf('First_Name');
      var lastNameCol = athletesHeaders.indexOf('Last_Name');
      var name = '';
      if (nameCol >= 0 && row[nameCol]) {
        name = row[nameCol];
      } else if (firstNameCol >= 0) {
        name = row[firstNameCol] + ' ' + (lastNameCol >= 0 ? row[lastNameCol] || '' : '');
      }

      var student = {
        Athlete_ID: athleteId,
        Name: name.trim(),
        Email: row[athletesHeaders.indexOf('Email')] || '',
        Grade: row[athletesHeaders.indexOf('Grade')] || row[athletesHeaders.indexOf('Year_Group')] || '',
        Gender: row[athletesHeaders.indexOf('Gender')] || ''
      };

      // Find matching strength data
      var strengthRow = null;
      if (strengthData.length > 1) {
        var strIdCol = strengthHeaders.indexOf('Athlete_ID');
        for (var j = 1; j < strengthData.length; j++) {
          if (strengthData[j][strIdCol] == athleteId) {
            strengthRow = strengthData[j];
            break;
          }
        }
      }

      // Add strength fields — level-specific Str columns
      var patterns = ['Squat', 'Push', 'Pull', 'Hinge', 'Lunge', 'Press'];
      for (var p = 0; p < patterns.length; p++) {
        var pat = patterns[p];
        if (strengthRow) {
          var techIdx = strengthHeaders.indexOf(pat + '_Tech');
          var techVal = techIdx >= 0 ? (parseInt(strengthRow[techIdx]) || 0) : 0;
          student[pat + '_Tech'] = techVal;

          // Read level-specific Str column based on current Tech level
          var strVal = 0;
          if (techVal >= 2 && techVal <= 5) {
            var levelStrIdx = strengthHeaders.indexOf(pat + '_Str_L' + techVal);
            strVal = levelStrIdx >= 0 ? (parseInt(strengthRow[levelStrIdx]) || 0) : 0;
          }
          // TEMPORARY FALLBACK: if level-specific column is empty, fall back to old {Pattern}_Str column
          // Remove this fallback once all data is migrated to level-specific columns
          if (strVal === 0) {
            var oldStrIdx = strengthHeaders.indexOf(pat + '_Str');
            if (oldStrIdx >= 0) {
              strVal = parseInt(strengthRow[oldStrIdx]) || 0;
            }
          }
          student[pat + '_Str'] = strVal;

          // Also include all level-specific Str values for portals that need them
          for (var lvl = 2; lvl <= 5; lvl++) {
            var lvlIdx = strengthHeaders.indexOf(pat + '_Str_L' + lvl);
            student[pat + '_Str_L' + lvl] = lvlIdx >= 0 ? (parseInt(strengthRow[lvlIdx]) || 0) : 0;
          }
        } else {
          student[pat + '_Tech'] = 0;
          student[pat + '_Str'] = 0;
          for (var lvl = 2; lvl <= 5; lvl++) {
            student[pat + '_Str_L' + lvl] = 0;
          }
        }
      }

      // Add notes from Strength sheet
      if (strengthRow) {
        var notesIdx = strengthHeaders.indexOf('Notes');
        if (notesIdx >= 0) student.Notes = strengthRow[notesIdx] || '';
      }

      // Session count from Workout_Logs
      var strId = String(athleteId).trim();
      student.Total_Sessions = sessionCounts[strId] || 0;
      student.Last_Session_Date = lastSessionDates[strId] ?
        Utilities.formatDate(lastSessionDates[strId], ss.getSpreadsheetTimeZone(), 'MMM dd, yyyy') : '';

      students.push(student);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      students: students
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Get config value (e.g., CurrentSession)
function getConfig(ss, key) {
  try {
    var configSheet = ss.getSheetByName('Config');
    if (!configSheet) {
      configSheet = ss.insertSheet('Config');
      configSheet.getRange('A1:B1').setValues([['Key', 'Value']]);
      configSheet.getRange('A2:B2').setValues([['CurrentSession', '1']]);
    }

    var data = configSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          key: key,
          value: data[i][1]
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    var defaultValue = '';
    if (key === 'CurrentSession') defaultValue = '1';

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      key: key,
      value: defaultValue
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Set config value
function setConfig(ss, key, value) {
  try {
    var configSheet = ss.getSheetByName('Config');
    if (!configSheet) {
      configSheet = ss.insertSheet('Config');
      configSheet.getRange('A1:B1').setValues([['Key', 'Value']]);
    }

    var data = configSheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        configSheet.getRange(i + 1, 2).setValue(value);
        found = true;
        break;
      }
    }

    if (!found) {
      var lastRow = configSheet.getLastRow();
      configSheet.getRange(lastRow + 1, 1, 1, 2).setValues([[key, value]]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      key: key,
      value: value
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Update student data — returns saved values for confirmation
function updateStudent(athleteId, updates) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var strengthSheet = ss.getSheetByName('Strength');

    if (!strengthSheet) {
      strengthSheet = ss.insertSheet('Strength');
      // Create sheet with level-specific Str columns (L2–L5) per pattern
      // Old {Pattern}_Str columns kept for backwards compatibility during migration
      var sheetHeaders = ['Athlete_ID', 'Date'];
      var strPatterns = ['Squat', 'Push', 'Pull', 'Hinge', 'Lunge', 'Press'];
      for (var sp = 0; sp < strPatterns.length; sp++) {
        sheetHeaders.push(strPatterns[sp] + '_Tech');
        sheetHeaders.push(strPatterns[sp] + '_Str');      // legacy column — remove after migration
        sheetHeaders.push(strPatterns[sp] + '_Str_L2');
        sheetHeaders.push(strPatterns[sp] + '_Str_L3');
        sheetHeaders.push(strPatterns[sp] + '_Str_L4');
        sheetHeaders.push(strPatterns[sp] + '_Str_L5');
      }
      strengthSheet.getRange(1, 1, 1, sheetHeaders.length).setValues([sheetHeaders]);
    }

    // Validate fields — includes level-specific Str columns and legacy columns
    var validFields = [
      'Squat_Tech', 'Squat_Str', 'Push_Tech', 'Push_Str',
      'Pull_Tech', 'Pull_Str', 'Hinge_Tech', 'Hinge_Str',
      'Lunge_Tech', 'Lunge_Str', 'Press_Tech', 'Press_Str',
      'Squat_Str_L2', 'Squat_Str_L3', 'Squat_Str_L4', 'Squat_Str_L5',
      'Push_Str_L2', 'Push_Str_L3', 'Push_Str_L4', 'Push_Str_L5',
      'Pull_Str_L2', 'Pull_Str_L3', 'Pull_Str_L4', 'Pull_Str_L5',
      'Hinge_Str_L2', 'Hinge_Str_L3', 'Hinge_Str_L4', 'Hinge_Str_L5',
      'Lunge_Str_L2', 'Lunge_Str_L3', 'Lunge_Str_L4', 'Lunge_Str_L5',
      'Press_Str_L2', 'Press_Str_L3', 'Press_Str_L4', 'Press_Str_L5',
      'Notes', 'Date'
    ];

    var data = strengthSheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('Athlete_ID');

    // Find the student row
    var studentRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] == athleteId) {
        studentRow = i + 1;
        break;
      }
    }

    if (studentRow === -1) {
      studentRow = strengthSheet.getLastRow() + 1;
      strengthSheet.getRange(studentRow, idCol + 1).setValue(athleteId);
      var dateCol = headers.indexOf('Date');
      if (dateCol >= 0) {
        strengthSheet.getRange(studentRow, dateCol + 1).setValue(new Date());
      }
    }

    // Apply updates and track what was saved
    var savedValues = {};
    for (var field in updates) {
      if (updates.hasOwnProperty(field)) {
        var value = updates[field];
        var colIdx = headers.indexOf(field);

        // Validate tech/str values are in range
        if (field.indexOf('_Tech') >= 0) {
          value = Math.max(0, Math.min(5, parseInt(value) || 0));
        }
        if (field.indexOf('_Str') >= 0 && field.indexOf('_Tech') === -1) {
          value = Math.max(0, Math.min(5, parseInt(value) || 0));
        }

        if (colIdx >= 0) {
          strengthSheet.getRange(studentRow, colIdx + 1).setValue(value);
          savedValues[field] = value;
        } else if (validFields.indexOf(field) >= 0) {
          // Column doesn't exist but field is valid — add it
          var newCol = strengthSheet.getLastColumn() + 1;
          strengthSheet.getRange(1, newCol).setValue(field);
          strengthSheet.getRange(studentRow, newCol).setValue(value);
          savedValues[field] = value;
          headers.push(field);
        }
      }
    }

    // Update the Date column to track when last modified
    var dateCol = headers.indexOf('Date');
    if (dateCol >= 0) {
      strengthSheet.getRange(studentRow, dateCol + 1).setValue(new Date());
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      athleteId: athleteId,
      updated: Object.keys(savedValues),
      savedValues: savedValues
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}


// ========================================
// EXISTING DASHBOARD FUNCTIONS
// ========================================

function handleStudentRequest(ss, userEmail) {
  if (!userEmail) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'No email provided',
      authenticated: false
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }

  var athletesSheet = ss.getSheetByName('Athletes');
  if (!athletesSheet) {
    throw new Error('Athletes sheet not found');
  }

  var data = athletesSheet.getDataRange().getValues();
  var headers = data[0];
  var emailColIndex = headers.indexOf('Email');

  if (emailColIndex === -1) {
    throw new Error('Email column not found');
  }

  var athleteRow = null;
  var athleteId = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][emailColIndex] && data[i][emailColIndex].toLowerCase() === userEmail.toLowerCase()) {
      athleteRow = data[i];
      athleteId = data[i][0];
      break;
    }
  }

  if (!athleteRow) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'No athlete found with this email',
      authenticated: false,
      email: userEmail
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }

  var athlete = buildAthleteObject(ss, athleteRow, headers, athleteId);

  return ContentService.createTextOutput(JSON.stringify({
    authenticated: true,
    athlete: athlete
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

function handleAdminRequest(ss) {
  var athletesSheet = ss.getSheetByName('Athletes');
  if (!athletesSheet) {
    throw new Error('Athletes sheet not found');
  }

  var data = athletesSheet.getDataRange().getValues();
  var headers = data[0];
  var athletes = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var athleteId = data[i][0];
      var athlete = buildAthleteObject(ss, data[i], headers, athleteId);
      athletes.push(athlete);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    authenticated: true,
    admin: true,
    athletes: athletes
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

function buildAthleteObject(ss, athleteRow, headers, athleteId) {
  var athlete = {};
  headers.forEach(function(header, index) {
    athlete[header] = athleteRow[index];
  });

  // Psychology data
  var psychData = getLatestAssessment(ss, 'Psych_Assessments', athleteId);
  var gritData = getLatestAssessment(ss, 'Grit_Journal', athleteId);

  if (psychData || gritData) {
    athlete.psych = {};

    if (gritData && gritData.scores.Grit_Assignment) {
      athlete.psych.Grit = gritData.scores.Grit_Assignment;
    }

    if (psychData) {
      athlete.psych.Mindset = psychData.scores.Mindset;
      athlete.psych.Focus_Engagement = psychData.scores.Focus_Engagement;
      athlete.psych.Effort_Work_Ethic = psychData.scores.Effort_Work_Ethic;
      athlete.psych.Coachability = psychData.scores.Coachability;
      athlete.psych.Mental_Toughness = psychData.scores.Mental_Toughness;
    }

    var psychHistory = psychData ? psychData.history : [];
    var gritHistory = gritData ? gritData.history : [];
    athlete.psych_history = psychHistory.concat(gritHistory).sort(function(a, b) {
      return new Date(b.Date) - new Date(a.Date);
    });
  } else {
    athlete.psych = {};
    athlete.psych_history = [];
  }

  // Strength data
  var strengthData = getLatestAssessment(ss, 'Strength', athleteId);
  if (strengthData) {
    athlete.strength = strengthData.scores;
    athlete.strength_history = strengthData.history;
  } else {
    athlete.strength = {};
    athlete.strength_history = [];
  }

  // Performance data
  var performanceData = getLatestAssessment(ss, 'Performance', athleteId);
  if (performanceData) {
    athlete.performance = performanceData.scores;
    athlete.performance_history = performanceData.history;
  } else {
    athlete.performance = {};
    athlete.performance_history = [];
  }

  // Mobility data
  var mobilityData = getLatestAssessment(ss, 'Mobility', athleteId);
  if (mobilityData) {
    athlete.mobility = mobilityData.scores;
    athlete.mobility_history = mobilityData.history;
  } else {
    athlete.mobility = {};
    athlete.mobility_history = [];
  }

  // Recovery data
  var recoveryData = getLatestAssessment(ss, 'Recovery', athleteId);
  if (recoveryData) {
    athlete.recovery = recoveryData.scores;
    athlete.recovery_history = recoveryData.history;
  } else {
    athlete.recovery = {};
    athlete.recovery_history = [];
  }

  return athlete;
}

function getLatestAssessment(ss, sheetName, athleteId) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var headers = data[0];
  var idColIndex = headers.indexOf('Athlete_ID');
  var dateColIndex = headers.indexOf('Date');

  if (idColIndex === -1) return null;

  var athleteEntries = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][idColIndex] == athleteId) {
      var entry = {};
      headers.forEach(function(header, index) {
        entry[header] = data[i][index];
      });
      athleteEntries.push(entry);
    }
  }

  if (athleteEntries.length === 0) return null;

  if (dateColIndex !== -1) {
    athleteEntries.sort(function(a, b) {
      return new Date(b.Date) - new Date(a.Date);
    });
  }

  return {
    scores: athleteEntries[0],
    history: athleteEntries
  };
}


// ========================================
// WORKOUT SYSTEM FUNCTIONS
// ========================================

function saveWorkout(athleteId, sessionType, exercisesCompleted, notes, durationMinutes, rpe) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logsSheet = ss.getSheetByName('Workout_Logs');

  if (!logsSheet) {
    throw new Error('Workout_Logs sheet not found. Please create it first.');
  }

  var data = logsSheet.getDataRange().getValues();
  var lastSessionNumber = 0;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(athleteId).trim()) {
      var sessionNum = parseInt(data[i][3]) || 0;
      if (sessionNum > lastSessionNumber) {
        lastSessionNumber = sessionNum;
      }
    }
  }

  var newSessionNumber = lastSessionNumber + 1;
  var sessionDate = new Date();

  logsSheet.appendRow([
    athleteId,
    sessionDate,
    sessionType,
    newSessionNumber,
    exercisesCompleted,
    notes || '',
    durationMinutes || 45,
    'TRUE',
    rpe || ''
  ]);

  return {
    success: true,
    sessionNumber: newSessionNumber,
    message: 'Workout saved successfully!'
  };
}

function getLastSession(athleteId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logsSheet = ss.getSheetByName('Workout_Logs');

  if (!logsSheet) {
    return { type: null, number: 0 };
  }

  var data = logsSheet.getDataRange().getValues();
  var lastSession = null;
  var lastDate = null;
  var searchId = String(athleteId).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      var sessionDate;
      try {
        sessionDate = new Date(data[i][1]);
        if (isNaN(sessionDate.getTime())) sessionDate = new Date(0);
      } catch(e) {
        sessionDate = new Date(0);
      }
      if (!lastDate || sessionDate > lastDate) {
        lastDate = sessionDate;
        lastSession = {
          type: data[i][2],
          number: data[i][3],
          date: data[i][1],
          exercises: data[i][4],
          sessionNumber: data[i][3]
        };
      }
    }
  }

  if (!lastSession) {
    return { type: null, number: 0, sessionNumber: 0 };
  }
  return lastSession;
}

function getLastSessionByType(athleteId, sessionType) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logsSheet = ss.getSheetByName('Workout_Logs');
  if (!logsSheet) return null;

  var data = logsSheet.getDataRange().getValues();
  var lastSession = null;
  var lastDate = null;
  var searchId = String(athleteId).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId && String(data[i][2]).trim() === sessionType) {
      var sessionDate;
      try {
        sessionDate = new Date(data[i][1]);
        if (isNaN(sessionDate.getTime())) sessionDate = new Date(0);
      } catch(e) {
        sessionDate = new Date(0);
      }
      if (!lastDate || sessionDate > lastDate) {
        lastDate = sessionDate;
        lastSession = {
          type: data[i][2],
          number: data[i][3],
          date: data[i][1],
          exercises: data[i][4]
        };
      }
    }
  }
  return lastSession;
}

function getWorkoutHistory(athleteId, limit) {
  limit = limit || 10;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logsSheet = ss.getSheetByName('Workout_Logs');
  if (!logsSheet) return [];

  var data = logsSheet.getDataRange().getValues();
  var sessions = [];
  var timeZone = ss.getSpreadsheetTimeZone();
  var searchId = String(athleteId).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      var dateStr = '';
      try {
        var d = new Date(data[i][1]);
        if (!isNaN(d.getTime())) {
          dateStr = Utilities.formatDate(d, timeZone, 'MMM dd, yyyy');
        } else {
          dateStr = String(data[i][1]);
        }
      } catch(e) {
        dateStr = String(data[i][1]);
      }

      sessions.push({
        date: dateStr,
        type: data[i][2] || '',
        number: data[i][3] || 0,
        exercises: data[i][4] || '',
        notes: data[i][5] || '',
        duration: data[i][6] || 0,
        completed: data[i][7] || '',
        rpe: data[i][8] || ''
      });
    }
  }

  sessions.sort(function(a, b) { return b.number - a.number; });
  return sessions.slice(0, limit);
}

function getNextWeights(athleteId) {
  var lastSession = getLastSession(athleteId);
  if (!lastSession.type || !lastSession.exercises) {
    return {};
  }

  var PROGRESSION = {
    'Squat': 2.5,
    'Hinge': 2.5,
    'Push': 2.0,
    'Pull': 2.0,
    'Lunge': 1.5,
    'Press': 1.0
  };

  try {
    var exercises = JSON.parse(lastSession.exercises);
    var nextWeights = {};
    for (var pattern in exercises) {
      if (exercises.hasOwnProperty(pattern)) {
        var data = exercises[pattern];
        if (data.weight && data.weight > 0) {
          var progression = PROGRESSION[pattern] || 0;
          nextWeights[pattern] = data.weight + progression;
        }
      }
    }
    return nextWeights;
  } catch (e) {
    Logger.log('Error parsing exercises JSON: ' + e);
    return {};
  }
}

// ========================================
// AI COACHING INSIGHTS
// Set this via File > Project Properties > Script Properties, key: ANTHROPIC_API_KEY
// ========================================
function handleGetAICoachingInsights(studentData) {
  try {
    var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return { success: false, error: 'ANTHROPIC_API_KEY not configured in Script Properties' };
    }

    if (!studentData) {
      return { success: false, error: 'No student data provided' };
    }

    var systemPrompt = 'You are a world-class youth athletic development coach. You write personalised, motivating insights for a 14-15 year old athlete based on their real performance data.\n'
      + 'Your coaching style:\n'
      + '- Rooted in positive psychology — always start from what\'s working\n'
      + '- Specific to their actual data — never generic\n'
      + '- Warm but direct — you respect their intelligence and effort\n'
      + '- Action-oriented — every insight ends with a clear next step\n'
      + '- Brief — each insight is 1-2 sentences maximum, punchy and memorable\n\n'
      + 'You never say "great job" or use hollow praise. You connect effort to outcome. You never mention scores or numbers directly — translate them into what they mean athletically.\n\n'
      + 'Respond in JSON only. No preamble, no markdown, no code blocks:\n'
      + '{\n'
      + '  "gritReminder": "1-2 sentence coaching note about their upcoming session",\n'
      + '  "strengthProgress": "1-2 sentence coaching note celebrating their specific strength gain",\n'
      + '  "unassessedGap": "1-2 sentence coaching note framing the unassessed area as an opportunity",\n'
      + '  "consistency": "1-2 sentence coaching note about what their session count says about them",\n'
      + '  "weakestComponent": "1-2 sentence coaching note about their biggest growth opportunity"\n'
      + '}';

    var userMessage = 'Here is this athlete\'s current data:\n' + JSON.stringify(studentData, null, 2)
      + '\n\nGenerate personalised coaching text for all applicable fields.';

    var payload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', options);
    var statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      return { success: false, error: 'Anthropic API returned status ' + statusCode };
    }

    var responseBody = JSON.parse(response.getContentText());
    var aiText = responseBody.content && responseBody.content[0] && responseBody.content[0].text;
    if (!aiText) {
      return { success: false, error: 'No text in API response' };
    }

    // Strip markdown fences if present
    aiText = aiText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    var insights = JSON.parse(aiText);

    return { success: true, insights: insights };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ========================================
// AI HERO INSIGHT
// Single-sentence trajectory headline for the dashboard hero card.
// Reuses the same ANTHROPIC_API_KEY script property as the carousel.
// ========================================
function handleGetHeroInsight(studentData) {
  try {
    var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return { success: false, error: 'ANTHROPIC_API_KEY not configured in Script Properties' };
    }

    if (!studentData) {
      return { success: false, error: 'No student data provided' };
    }

    var systemPrompt = 'You are a coach writing a single headline insight for a student athlete\'s profile. '
      + 'Write exactly one sentence, maximum 12 words, second person, warm and direct. '
      + 'Focus only on their overall trajectory and consistency — never mention specific scores, pillars, or test results. '
      + 'Make it feel like it was written for this specific athlete based on their data, not a generic motivational quote.';

    var userMessage = JSON.stringify(studentData);

    var payload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 80,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', options);
    var statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      return { success: false, error: 'Anthropic API returned status ' + statusCode };
    }

    var responseBody = JSON.parse(response.getContentText());
    var aiText = responseBody.content && responseBody.content[0] && responseBody.content[0].text;
    if (!aiText) {
      return { success: false, error: 'No text in API response' };
    }

    // Strip any stray quotes/markdown and return a clean sentence
    var sentence = aiText.replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim();
    sentence = sentence.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();

    return { success: true, insight: sentence };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ========================================
// NOMINATION HANDLER
// ========================================

function handleSaveNomination(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Nominations');

    if (!sheet) {
      sheet = ss.insertSheet('Nominations');
      sheet.appendRow([
        'Timestamp',
        'Coach_Name',
        'Coach_Role',
        'Coach_School',
        'Coach_Email',
        'Athlete_Name',
        'Athlete_Grade',
        'Nomination_Reason',
        'Grit_Rating',
        'Coachability_Rating',
        'SelfMotivation_Rating',
        'AthleticPotential_Rating',
        'Additional_Info'
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight('bold');
    }

    var ratings = data.ratings || {};

    sheet.appendRow([
      new Date(),
      data.coachName || '',
      data.coachRole || '',
      data.coachSchool || '',
      data.coachEmail || '',
      data.athleteName || '',
      data.athleteGrade || '',
      data.nominationReason || '',
      ratings.grit || 0,
      ratings.coachability || 0,
      ratings.selfMotivation || 0,
      ratings.athleticPotential || 0,
      data.additionalInfo || ''
    ]);

    return { success: true };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ========================================
// SESSION OBSERVATIONS
// ========================================
function ensureObservationsSheet(ss) {
  var sheet = ss.getSheetByName('Observations');
  var headers = ['Timestamp', 'Session_Number', 'Date', 'Athlete_ID', 'Athlete_Email', 'Rating', 'Rating_Label'];
  if (!sheet) {
    sheet = ss.insertSheet('Observations');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('1:1').setFontWeight('bold');
    return sheet;
  }
  var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (existing.indexOf(headers[i]) === -1) {
      var newCol = Math.max(sheet.getLastColumn() + 1, i + 1);
      sheet.getRange(1, newCol).setValue(headers[i]);
    }
  }
  return sheet;
}

function handleSaveObservation(ss, data) {
  try {
    if (!data.athleteEmail || !data.sessionNumber || !data.rating) {
      return { success: false, error: 'Missing required fields (athleteEmail, sessionNumber, rating)' };
    }

    var sheet = ensureObservationsSheet(ss);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var col = {
      ts: headers.indexOf('Timestamp') + 1,
      session: headers.indexOf('Session_Number') + 1,
      date: headers.indexOf('Date') + 1,
      aid: headers.indexOf('Athlete_ID') + 1,
      email: headers.indexOf('Athlete_Email') + 1,
      rating: headers.indexOf('Rating') + 1,
      label: headers.indexOf('Rating_Label') + 1
    };

    var athleteId = data.athleteId || lookupAthleteIdByEmail(ss, data.athleteEmail) || '';
    var emailLower = String(data.athleteEmail).toLowerCase();
    var sessionNum = parseInt(data.sessionNumber, 10);

    // Look for existing row for this athlete + session
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    if (lastRow > 1) {
      var range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      for (var i = 0; i < range.length; i++) {
        var rowEmail = col.email > 0 ? String(range[i][col.email - 1] || '').toLowerCase() : '';
        var rowSession = col.session > 0 ? parseInt(range[i][col.session - 1], 10) : 0;
        if (rowEmail === emailLower && rowSession === sessionNum) {
          targetRow = i + 2;
          break;
        }
      }
    }

    var now = new Date();
    var values = {};
    values[col.ts] = now;
    values[col.session] = sessionNum;
    values[col.date] = data.date || '';
    values[col.aid] = athleteId;
    values[col.email] = data.athleteEmail;
    values[col.rating] = parseInt(data.rating, 10);
    values[col.label] = data.ratingLabel || '';

    if (targetRow > 0) {
      Object.keys(values).forEach(function (c) {
        var cn = parseInt(c, 10);
        if (cn > 0) sheet.getRange(targetRow, cn).setValue(values[c]);
      });
    } else {
      var newRow = new Array(sheet.getLastColumn());
      Object.keys(values).forEach(function (c) {
        var cn = parseInt(c, 10);
        if (cn > 0) newRow[cn - 1] = values[c];
      });
      sheet.appendRow(newRow);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleGetObservations(ss, sessionNumber) {
  try {
    var sheet = ss.getSheetByName('Observations');
    if (!sheet) return { success: true, observations: [] };
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, observations: [] };

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    var out = [];
    for (var i = 0; i < data.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j];
      }
      if (sessionNumber && parseInt(obj.Session_Number, 10) !== parseInt(sessionNumber, 10)) continue;
      out.push(obj);
    }
    return { success: true, observations: out };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
