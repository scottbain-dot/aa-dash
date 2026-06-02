// ========================================
// ATHLETE ACADEMY - APPS SCRIPT FOR TAB-BASED DATA
// WITH WORKOUT SYSTEM + ADMIN PANEL + GRIT CHALLENGE
// ========================================

// academy-portal.html uses: getAthleteData (GET, ?email=)
// New actions will be added in subsequent prompts

// ========================================
// CLASH OF THE CODES — CONFIG (Block 1)
// Edit bands + norms here. Re-calibrate before the event.
// ========================================

// Track lap length used for Cooper (bands × lap + partial = total metres).
var CLASH_LAP_LENGTH_M = 240;

// Per-test scoring config. Score = (improvement_pts + norm_pts) / 2, capped 0–5.
// norms[gender] = [t2, t3, t4, t5] thresholds. Direction sets how to compare.
// Higher-better: result ≥ tN ⇒ norm = N (max matched). Below t2 ⇒ 1.
// Lower-better:  result ≤ tN ⇒ norm = N (max matched). Above t2 ⇒ 1.
var CLASH_TESTS = {
  broad_jump: {
    direction: 'higher',
    unit: 'cm',
    bandWidth: 5,            // cm  (≈ 0.05 m placeholder)
    attempts: 2,
    // TODO: replace with real norm thresholds before the event.
    norms: {
      M: [180, 200, 220, 240],
      F: [150, 170, 190, 210]
    }
  },
  sprint_40m: {
    direction: 'lower',
    unit: 'sec',
    bandWidth: 0.05,         // seconds (placeholder)
    attempts: 1,
    // TODO: replace with real norm thresholds before the event.
    norms: {
      M: [6.40, 6.10, 5.80, 5.50],
      F: [6.80, 6.50, 6.20, 5.90]
    }
  },
  agility_510: {
    direction: 'lower',
    unit: 'sec',
    bandWidth: 0.1,          // seconds (placeholder)
    attempts: 2,
    // TODO: replace with real norm thresholds before the event.
    norms: {
      M: [5.40, 5.20, 5.00, 4.80],
      F: [5.70, 5.50, 5.30, 5.10]
    }
  },
  cooper: {
    direction: 'higher',
    unit: 'm',
    bandWidth: 150,          // metres (placeholder)
    attempts: 1,
    // Last year's Cooper norms.
    norms: {
      M: [2000, 2200, 2400, 2600],
      F: [1600, 1800, 2000, 2200]
    }
  }
};

// Which column in the Performance sheet each test's baseline reads from.
var CLASH_BASELINE_COLS = {
  broad_jump: 'Broad_Jump_cm',
  sprint_40m: '40m_sec',
  agility_510: '5_10_5_sec',
  cooper: 'Cooper_m'
};

// Ranking direction per non-fitness event. higher = bigger raw is better.
var CLASH_EVENT_DIRECTIONS = {
  'Warm Up': 'higher',
  'Hype': 'higher',
  'Tug of War': 'higher',
  'Relays': 'lower',
  'Game': 'higher',
  '100m Row': 'lower',
  '100m Sprint': 'lower',
  'Grit Challenge': 'higher',
  'Planning': 'higher',
  'Snacks': 'higher'
};

// Initial event roster — seeded once when Clash_Events is empty.
var CLASH_EVENT_SEED = [
  { name: 'Warm Up',        type: 'whole',     hidden: false, order: 1 },
  { name: 'Hype',           type: 'whole',     hidden: false, order: 2 },
  { name: 'Tug of War',     type: 'whole',     hidden: false, order: 3 },
  { name: 'Relays',         type: 'whole',     hidden: false, order: 4 },
  { name: 'Game',           type: 'whole',     hidden: false, order: 5 },
  { name: '100m Row',       type: 'nominated', hidden: false, order: 6 },
  { name: '100m Sprint',    type: 'nominated', hidden: false, order: 7 },
  { name: 'Grit Challenge', type: 'nominated', hidden: true,  order: 8 },
  { name: 'Planning',       type: 'prejudged', hidden: false, order: 9 },
  { name: 'Snacks',         type: 'prejudged', hidden: false, order: 10 }
];

// Points awarded by event rank (1st → 6pts, 6th → 1pt). Ties split average.
var CLASH_POINTS_BY_RANK = [6, 5, 4, 3, 2, 1];

// Sanity thresholds — fitness retest UI uses these to flag absurd entries.
// Inclusive bounds; outside them prompts a confirm rather than blocking.
var CLASH_SANITY = {
  broad_jump: { maxCm: 400 },
  sprint_40m: { minSec: 4 },
  agility_510: { minSec: 4 },
  cooper:     { maxBands: 10 }
};

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
      return handleStudentRequest(ss, email, e.parameter.portal);
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

    // ===== FUEL LAB QUIZ STATS (teacher view) =====
    if (action === 'getFuelLabQuizStats') {
      var fuelStatsResult = handleGetFuelLabQuizStats(ss);
      return ContentService.createTextOutput(JSON.stringify(fuelStatsResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== ATHLETE PORTAL (G10-12) ACTIONS =====
    if (action === 'getPortalBootstrap') {
      return apJson(handleGetPortalBootstrap(ss, e.parameter.email));
    }
    if (action === 'getYearMap') {
      return apJson(handleGetYearMap(ss, e.parameter.email));
    }
    if (action === 'getWeek') {
      return apJson(handleGetWeek(ss, e.parameter.email, e.parameter.weekStart));
    }
    if (action === 'getYearLoad') {
      return apJson(handleGetYearLoad(ss, e.parameter.email));
    }
    if (action === 'getPBs') {
      return apJson(handleGetPBs(ss, e.parameter.email));
    }

    // ===== CLASH OF THE CODES ACTIONS =====
    if (action === 'getClashTeams') {
      return apJson(handleGetClashTeams(ss));
    }
    if (action === 'getClashEvents') {
      return apJson(handleGetClashEvents(ss, {
        hideHidden: e.parameter.hideHidden === 'true'
      }));
    }
    if (action === 'getClashLeaderboard') {
      return apJson(handleGetClashLeaderboard(ss));
    }
    if (action === 'getClashResults') {
      return apJson(handleGetClashResults(ss, {
        event: e.parameter.event,
        team: e.parameter.team,
        athleteId: e.parameter.athleteId
      }));
    }
    if (action === 'getClashConfig') {
      return apJson(handleGetClashConfig());
    }
    if (action === 'getUnassignedAthletes') {
      return apJson(handleGetUnassignedAthletes(ss));
    }
    if (action === 'getTeamRoles') {
      return ContentService.createTextOutput(JSON.stringify(handleGetTeamRoles(ss, e.parameter.team)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getClashLunchPlan') {
      return apJson(handleGetClashLunchPlan(ss, e.parameter.email, e.parameter.athleteId));
    }
    if (action === 'getHelpers') {
      return apJson(handleGetHelpers(ss));
    }

    // ===== EXISTING DASHBOARD LOGIC =====
    if (e.parameter.admin === 'true') {
      return handleAdminRequest(ss);
    }

    return handleStudentRequest(ss, e.parameter.email, e.parameter.portal);

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

    // ===== SAVE STUDENT APPLICATION =====
    if (data.action === 'saveStudentApplication') {
      var appResult = handleSaveStudentApplication(data);
      return ContentService.createTextOutput(JSON.stringify(appResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== SAVE SESSION OBSERVATION =====
    if (data.action === 'saveObservation') {
      var ssObs = SpreadsheetApp.getActiveSpreadsheet();
      var obsSaveResult = handleSaveObservation(ssObs, data);
      return ContentService.createTextOutput(JSON.stringify(obsSaveResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== FUEL LAB QUIZ SUBMISSION =====
    if (data.action === 'submitFuelLabQuiz') {
      var ssFuel = SpreadsheetApp.getActiveSpreadsheet();
      var fuelResult = handleSubmitFuelLabQuiz(ssFuel, data);
      return ContentService.createTextOutput(JSON.stringify(fuelResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== FUEL LAB PLAN BUILDER =====
    if (data.action === 'saveFuelLabPlan') {
      var ssPlan = SpreadsheetApp.getActiveSpreadsheet();
      var planResult = handleSaveFuelLabPlan(ssPlan, data);
      return ContentService.createTextOutput(JSON.stringify(planResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== ATHLETE PORTAL (G10-12) WRITES =====
    if (data.action === 'saveYearMap') {
      var ssAp = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleSaveYearMap(ssAp, data.email, data.yearMap));
    }
    if (data.action === 'saveBlock') {
      var ssAp2 = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleSaveBlock(ssAp2, data.email, data.sport, data.month, data.block));
    }
    if (data.action === 'saveSession') {
      var ssAp3 = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleSaveSession(ssAp3, data.email, data.session));
    }
    if (data.action === 'savePB') {
      var ssAp4 = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleSavePB(ssAp4, data.email, data.pb));
    }

    // ===== CLASH OF THE CODES WRITES =====
    if (data.action === 'saveClashTeam') {
      var ssClashT = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleSaveClashTeam(ssClashT, data));
    }
    if (data.action === 'saveClashNomination') {
      var ssClashN = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleSaveClashNomination(ssClashN, data));
    }
    if (data.action === 'claimRole') {
      return apJson(handleClaimRole(SpreadsheetApp.getActiveSpreadsheet(), data));
    }
    if (data.action === 'setPlanDocUrl') {
      return apJson(handleSetPlanDocUrl(SpreadsheetApp.getActiveSpreadsheet(), data));
    }
    if (data.action === 'addVolunteer') {
      return apJson(handleAddVolunteer(SpreadsheetApp.getActiveSpreadsheet(), data));
    }
    if (data.action === 'removeVolunteer') {
      return apJson(handleRemoveVolunteer(SpreadsheetApp.getActiveSpreadsheet(), data));
    }
    if (data.action === 'saveClashResult') {
      var ssClashR = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleSaveClashResult(ssClashR, data));
    }
    if (data.action === 'saveClashFitnessRetest') {
      var ssClashF = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleSaveClashFitnessRetest(ssClashF, data));
    }
    if (data.action === 'setClashConfig') {
      var ssClashC = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleSetClashConfig(ssClashC, data));
    }
    if (data.action === 'deleteClashTeam') {
      var ssClashD = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleDeleteClashTeam(ssClashD, data));
    }
    if (data.action === 'saveClashLunchPlan') {
      var ssClashL = SpreadsheetApp.getActiveSpreadsheet();
      return apJson(handleSaveClashLunchPlan(ssClashL, data));
    }
    if (data.action === 'claimHelperRole') {
      return apJson(handleClaimHelperRole(SpreadsheetApp.getActiveSpreadsheet(), data));
    }
    if (data.action === 'unclaimHelperRole') {
      return apJson(handleUnclaimHelperRole(SpreadsheetApp.getActiveSpreadsheet(), data));
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

function handleStudentRequest(ss, userEmail, portal) {
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
  var gradeColIndex = headers.indexOf('Grade');
  if (gradeColIndex === -1) gradeColIndex = headers.indexOf('Year_Group');

  if (emailColIndex === -1) {
    throw new Error('Email column not found');
  }

  // Collect every row matching this email (a student may have both a G9
  // and a G10-12 row when testing both portals with the same account).
  var matches = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][emailColIndex] && data[i][emailColIndex].toLowerCase() === userEmail.toLowerCase()) {
      matches.push(data[i]);
    }
  }

  var athleteRow = null;
  var athleteId = null;
  if (matches.length > 0) {
    var gradeOf = function(row) {
      return gradeColIndex === -1 ? NaN : parseInt(row[gradeColIndex], 10);
    };

    if (portal === 'g10') {
      // Highest-grade row in the 10-12 range.
      var best = null;
      matches.forEach(function(row) {
        var g = gradeOf(row);
        if (g >= 10 && g <= 12 && (best === null || g > gradeOf(best))) {
          best = row;
        }
      });
      athleteRow = best;
    } else {
      // portal === 'g9' or absent: prefer the G9 row, else first match.
      for (var m = 0; m < matches.length; m++) {
        if (gradeOf(matches[m]) === 9) {
          athleteRow = matches[m];
          break;
        }
      }
      if (!athleteRow) athleteRow = matches[0];
    }

    if (athleteRow) athleteId = athleteRow[0];
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

function handleSaveStudentApplication(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Student_Applications');

    if (!sheet) {
      sheet = ss.insertSheet('Student_Applications');
      sheet.appendRow([
        'Timestamp',
        'Student_Name',
        'Student_Email',
        'Current_Grade',
        'Sports',
        'Nominator_Name',
        'Why_Applying',
        'Commitment_Rating',
        'Additional_Info',
        'Goals',
        'Training_Detail',
        'Strength_Experience',
        'Support_Type'
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight('bold');
    }

    sheet.appendRow([
      new Date(),
      data.studentName || '',
      data.studentEmail || '',
      data.currentGrade || '',
      data.sports || '',
      data.nominatorName || '',
      data.whyApplying || '',
      data.commitmentRating || 0,
      data.additionalInfo || '',
      data.goals || '',
      data.trainingDetail || '',
      data.strengthExperience || 0,
      data.supportType || 0
    ]);

    return { success: true };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

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

// ========================================
// FUEL LAB QUIZ
// Sheet: FuelLab_Quiz
// Columns: Timestamp | Email | Name | Score | Total | Q1 | Q2 | ... | Q10
// Each Qn cell: 1 (correct), 0 (incorrect), or blank (unanswered)
// ========================================

var FUEL_LAB_QUIZ_QUESTION_COUNT = 10;

function ensureFuelLabQuizSheet(ss) {
  var sheet = ss.getSheetByName('FuelLab_Quiz');
  var headers = ['Timestamp', 'Email', 'Name', 'Score', 'Total'];
  for (var i = 1; i <= FUEL_LAB_QUIZ_QUESTION_COUNT; i++) {
    headers.push('Q' + i);
  }
  if (!sheet) {
    sheet = ss.insertSheet('FuelLab_Quiz');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }
  // Backfill any missing header columns without disturbing existing ones.
  var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  for (var h = 0; h < headers.length; h++) {
    if (existing.indexOf(headers[h]) === -1) {
      var newCol = Math.max(sheet.getLastColumn() + 1, h + 1);
      sheet.getRange(1, newCol).setValue(headers[h]);
    }
  }
  return sheet;
}

function handleSubmitFuelLabQuiz(ss, data) {
  try {
    if (!data.email) {
      return { success: false, error: 'Missing email' };
    }
    var sheet = ensureFuelLabQuizSheet(ss);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Build row aligned to header order so column reorders never break inserts.
    var row = new Array(headers.length);
    var total = parseInt(data.total, 10);
    if (!total || total < 1) total = FUEL_LAB_QUIZ_QUESTION_COUNT;

    // Map answers array -> per-question 1/0
    // answersArray entries shaped like { q: <0-based index>, correct: <bool> }.
    var answerMap = {};
    if (Array.isArray(data.answers)) {
      for (var i = 0; i < data.answers.length; i++) {
        var a = data.answers[i];
        if (a && typeof a.q === 'number') {
          answerMap[a.q] = a.correct ? 1 : 0;
        }
      }
    }

    for (var c = 0; c < headers.length; c++) {
      var name = headers[c];
      if (name === 'Timestamp') {
        row[c] = data.timestamp ? new Date(data.timestamp) : new Date();
      } else if (name === 'Email') {
        row[c] = data.email;
      } else if (name === 'Name') {
        row[c] = data.name || '';
      } else if (name === 'Score') {
        row[c] = parseInt(data.score, 10) || 0;
      } else if (name === 'Total') {
        row[c] = total;
      } else if (/^Q\d+$/.test(name)) {
        var qIdx = parseInt(name.substring(1), 10) - 1;
        row[c] = (qIdx in answerMap) ? answerMap[qIdx] : '';
      } else {
        row[c] = '';
      }
    }

    sheet.appendRow(row);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleGetFuelLabQuizStats(ss) {
  try {
    var sheet = ss.getSheetByName('FuelLab_Quiz');
    if (!sheet) {
      return { success: true, totalSubmissions: 0, uniqueStudents: 0, avgScore: 0, lastUpdate: '', questions: [] };
    }
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, totalSubmissions: 0, uniqueStudents: 0, avgScore: 0, lastUpdate: '', questions: [] };
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

    var col = {
      ts: headers.indexOf('Timestamp'),
      email: headers.indexOf('Email'),
      score: headers.indexOf('Score'),
      total: headers.indexOf('Total')
    };
    var qCols = []; // [{ index: <0-based question idx>, col: <0-based sheet col> }, ...]
    for (var h = 0; h < headers.length; h++) {
      var m = /^Q(\d+)$/.exec(headers[h]);
      if (m) qCols.push({ index: parseInt(m[1], 10) - 1, col: h });
    }
    qCols.sort(function (a, b) { return a.index - b.index; });

    // Pick the latest submission per student (by Timestamp).
    var latestByEmail = {};
    var lastUpdate = null;
    for (var r = 0; r < values.length; r++) {
      var row = values[r];
      var emailRaw = col.email >= 0 ? row[col.email] : '';
      if (!emailRaw) continue;
      var emailKey = String(emailRaw).toLowerCase();
      var ts = col.ts >= 0 ? row[col.ts] : null;
      var tsMs = (ts instanceof Date) ? ts.getTime() : (ts ? new Date(ts).getTime() : 0);
      if (!latestByEmail[emailKey] || tsMs >= latestByEmail[emailKey].tsMs) {
        latestByEmail[emailKey] = { row: row, tsMs: tsMs, ts: ts };
      }
      if (ts && (!lastUpdate || tsMs > lastUpdate.tsMs)) {
        lastUpdate = { ts: ts, tsMs: tsMs };
      }
    }

    var emails = Object.keys(latestByEmail);
    var uniqueStudents = emails.length;
    var totalSubmissions = values.length; // raw attempt count, retakes included

    if (uniqueStudents === 0) {
      return { success: true, totalSubmissions: totalSubmissions, uniqueStudents: 0, avgScore: 0, lastUpdate: '', questions: [] };
    }

    // Average score across latest-per-student submissions.
    var scoreSum = 0;
    var scoreCount = 0;
    for (var e = 0; e < emails.length; e++) {
      var rec = latestByEmail[emails[e]];
      var s = col.score >= 0 ? parseFloat(rec.row[col.score]) : NaN;
      if (!isNaN(s)) { scoreSum += s; scoreCount++; }
    }
    var avgScore = scoreCount > 0 ? (scoreSum / scoreCount) : 0;

    // Per-question correct% across latest-per-student.
    var questions = [];
    for (var q = 0; q < qCols.length; q++) {
      var qc = qCols[q];
      var correct = 0;
      var answered = 0;
      for (var ee = 0; ee < emails.length; ee++) {
        var v = latestByEmail[emails[ee]].row[qc.col];
        if (v === '' || v === null || typeof v === 'undefined') continue;
        answered++;
        if (Number(v) === 1) correct++;
      }
      var pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
      questions.push({ index: qc.index, correctPct: pct, totalAnswers: answered });
    }

    // Hardest = lowest %, Easiest = highest %, only over questions with answers.
    var answeredQs = questions.filter(function (q) { return q.totalAnswers > 0; });
    var hardest = null;
    var easiest = null;
    if (answeredQs.length) {
      hardest = answeredQs.reduce(function (a, b) { return a.correctPct <= b.correctPct ? a : b; });
      easiest = answeredQs.reduce(function (a, b) { return a.correctPct >= b.correctPct ? a : b; });
    }

    var lastUpdateStr = '';
    if (lastUpdate && lastUpdate.ts) {
      var d = (lastUpdate.ts instanceof Date) ? lastUpdate.ts : new Date(lastUpdate.ts);
      lastUpdateStr = Utilities.formatDate(d, Session.getScriptTimeZone() || 'Europe/Berlin', 'd MMM yyyy HH:mm');
    }

    return {
      success: true,
      totalSubmissions: totalSubmissions,
      uniqueStudents: uniqueStudents,
      avgScore: avgScore,
      lastUpdate: lastUpdateStr,
      hardest: hardest,
      easiest: easiest,
      questions: questions
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ========================================
// Sheet: FuelLab_Plans
// Columns: Timestamp | Email | Name | Scenario | Event_Description | Plan_JSON | Score | Feedback_Tags
// ========================================

function ensureFuelLabPlansSheet(ss) {
  var sheet = ss.getSheetByName('FuelLab_Plans');
  var headers = ['Timestamp', 'Email', 'Name', 'Scenario', 'Event_Description', 'Plan_JSON', 'Score', 'Feedback_Tags'];
  if (!sheet) {
    sheet = ss.insertSheet('FuelLab_Plans');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }
  // Backfill any missing header columns without disturbing existing ones.
  var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  for (var h = 0; h < headers.length; h++) {
    if (existing.indexOf(headers[h]) === -1) {
      var newCol = Math.max(sheet.getLastColumn() + 1, h + 1);
      sheet.getRange(1, newCol).setValue(headers[h]);
    }
  }
  return sheet;
}

function handleSaveFuelLabPlan(ss, data) {
  try {
    if (!data.email) {
      return { success: false, error: 'Missing email' };
    }
    var sheet = ensureFuelLabPlansSheet(ss);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var planJson = '';
    try {
      planJson = (typeof data.plan === 'string') ? data.plan : JSON.stringify(data.plan || {});
    } catch (e) {
      planJson = '';
    }

    var tags = '';
    if (Array.isArray(data.tags)) tags = data.tags.join(' | ');
    else if (typeof data.tags === 'string') tags = data.tags;

    // Build row aligned to header order so column reorders never break inserts.
    var row = new Array(headers.length);
    for (var c = 0; c < headers.length; c++) {
      var name = headers[c];
      if (name === 'Timestamp') {
        row[c] = data.timestamp ? new Date(data.timestamp) : new Date();
      } else if (name === 'Email') {
        row[c] = data.email;
      } else if (name === 'Name') {
        row[c] = data.name || '';
      } else if (name === 'Scenario') {
        row[c] = data.scenario || '';
      } else if (name === 'Event_Description') {
        row[c] = data.event || '';
      } else if (name === 'Plan_JSON') {
        row[c] = planJson;
      } else if (name === 'Score') {
        // Personal plans send null/'' (no score) — leave the cell blank for those.
        row[c] = (data.score === null || data.score === undefined || data.score === '')
          ? '' : (parseInt(data.score, 10) || 0);
      } else if (name === 'Feedback_Tags') {
        row[c] = tags;
      } else {
        row[c] = '';
      }
    }

    sheet.appendRow(row);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ============================================================
// ATHLETE PORTAL (G10-12) — athlete-portal.html
// Sheets: Year_Maps, Training_Sessions, PBs. All additive.
// Does not touch any G9 portal logic.
// ============================================================

// Standard JSON response wrapper for portal actions
function apJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Date -> 'YYYY-MM-DD' in the script timezone
function apDateStr(d) {
  if (!d) return '';
  if (typeof d === 'string') {
    var m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    d = new Date(d);
  }
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// Monday of the week containing the given date, as 'YYYY-MM-DD'
function apWeekStart(dateStr) {
  var s = apDateStr(dateStr);
  if (!s) return '';
  var parts = s.split('-');
  var dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  var dow = dt.getDay();          // 0 Sun .. 6 Sat
  var offset = (dow + 6) % 7;     // days since Monday
  dt.setDate(dt.getDate() - offset);
  return Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// Read all rows of a sheet into header-keyed objects (excludes header row)
function apReadObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    var blank = true;
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = data[i][c];
      if (data[i][c] !== '' && data[i][c] !== null) blank = false;
    }
    obj.__row = i + 1; // 1-based sheet row for in-place updates
    if (!blank) out.push(obj);
  }
  return out;
}

// Build a row array aligned to the sheet's header order from a field map
function apBuildRow(sheet, fields) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = new Array(headers.length);
  for (var c = 0; c < headers.length; c++) {
    row[c] = (fields.hasOwnProperty(headers[c])) ? fields[headers[c]] : '';
  }
  return row;
}

// Write a field map onto an existing row (header-aligned, only provided fields)
function apUpdateRow(sheet, rowNum, fields) {
  // Read the row once, overlay provided fields, write once.
  // (Per-cell setValue is the main source of save latency in Apps Script.)
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var row = sheet.getRange(rowNum, 1, 1, lastCol).getValues()[0];
  for (var c = 0; c < headers.length; c++) {
    if (fields.hasOwnProperty(headers[c])) row[c] = fields[headers[c]];
  }
  sheet.getRange(rowNum, 1, 1, lastCol).setValues([row]);
}

// Minimal athlete lookup (name/grade/sport) for the portal nav + identity
function apGetAthlete(ss, email) {
  var sheet = ss.getSheetByName('Athletes');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol = headers.indexOf('Email');
  if (emailCol === -1) return null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol] && String(data[i][emailCol]).toLowerCase() === String(email).toLowerCase()) {
      var obj = {};
      for (var c = 0; c < headers.length; c++) obj[headers[c]] = data[i][c];
      return obj;
    }
  }
  return null;
}

function apParse(val, fallback) {
  if (val === '' || val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (e) { return fallback; }
}

// ----- Sheet ensure helpers -----
function apEnsureYearMaps(ss) {
  var sheet = ss.getSheetByName('Year_Maps');
  if (!sheet) {
    sheet = ss.insertSheet('Year_Maps');
    sheet.getRange(1, 1, 1, 8).setValues([[
      'Athlete_ID', 'Year', 'Vision', 'A_Priority_JSON', 'Sports_JSON',
      'Testing_Windows_JSON', 'Other_Commitments_JSON', 'Updated'
    ]]);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  return sheet;
}

function apEnsureTrainingSessions(ss) {
  var sheet = ss.getSheetByName('Training_Sessions');
  if (!sheet) {
    sheet = ss.insertSheet('Training_Sessions');
    sheet.getRange(1, 1, 1, 16).setValues([[
      'Session_ID', 'Athlete_ID', 'Date', 'Week_Start', 'Sport', 'Name',
      'Intensity', 'Planned_Duration', 'RPE', 'Duration', 'Load_au',
      'Status', 'Is_PB', 'Planned_JSON', 'Note', 'Updated'
    ]]);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  return sheet;
}

function apEnsurePBs(ss) {
  var sheet = ss.getSheetByName('PBs');
  if (!sheet) {
    sheet = ss.insertSheet('PBs');
    sheet.getRange(1, 1, 1, 10).setValues([[
      'Athlete_ID', 'Sport', 'Exercise', 'Value', 'Unit', 'Date',
      'Previous_Value', 'Note', 'Session_ID', 'Updated'
    ]]);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  return sheet;
}

// ----- Cache helpers (per-athlete, short TTL) -----
function apCacheGet(key) {
  try {
    var v = CacheService.getScriptCache().get(key);
    return v ? JSON.parse(v) : null;
  } catch (e) { return null; }
}
function apCachePut(key, obj) {
  try { CacheService.getScriptCache().put(key, JSON.stringify(obj), 300); } catch (e) {}
}
function apCacheClear(athleteId) {
  try {
    CacheService.getScriptCache().removeAll(['ap_year_' + athleteId, 'ap_load_' + athleteId]);
  } catch (e) {}
}

// ----- Year_Maps -----
function apLoadYearMap(ss, athleteId) {
  var sheet = apEnsureYearMaps(ss);
  var rows = apReadObjects(sheet);
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i].Athlete_ID).trim() === String(athleteId).trim()) {
      return {
        __row: rows[i].__row,
        year: rows[i].Year || '',
        vision: rows[i].Vision || '',
        aPriority: apParse(rows[i].A_Priority_JSON, null),
        sports: apParse(rows[i].Sports_JSON, []),
        testingWindows: apParse(rows[i].Testing_Windows_JSON, []),
        otherCommitments: apParse(rows[i].Other_Commitments_JSON, []),
        updated: rows[i].Updated || ''
      };
    }
  }
  return null;
}

function handleGetYearMap(ss, email) {
  try {
    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) return { success: true, yearMap: null };
    var cached = apCacheGet('ap_year_' + athleteId);
    if (cached) return { success: true, yearMap: cached };
    var map = apLoadYearMap(ss, athleteId);
    if (map) { delete map.__row; apCachePut('ap_year_' + athleteId, map); }
    return { success: true, yearMap: map };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleSaveYearMap(ss, email, yearMap) {
  try {
    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) return { success: false, error: 'No athlete for ' + email };
    var sheet = apEnsureYearMaps(ss);
    var existing = apLoadYearMap(ss, athleteId);
    var fields = {
      'Athlete_ID': athleteId,
      'Year': yearMap.year || '',
      'Vision': yearMap.vision || '',
      'A_Priority_JSON': JSON.stringify(yearMap.aPriority || null),
      'Sports_JSON': JSON.stringify(yearMap.sports || []),
      'Testing_Windows_JSON': JSON.stringify(yearMap.testingWindows || []),
      'Other_Commitments_JSON': JSON.stringify(yearMap.otherCommitments || []),
      'Updated': new Date()
    };
    if (existing && existing.__row) apUpdateRow(sheet, existing.__row, fields);
    else sheet.appendRow(apBuildRow(sheet, fields));
    apCacheClear(athleteId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Patch one {sport, month} block inside the year map
function handleSaveBlock(ss, email, sportName, month, block) {
  try {
    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) return { success: false, error: 'No athlete for ' + email };
    var map = apLoadYearMap(ss, athleteId) || {
      year: '', vision: '', aPriority: null, sports: [], testingWindows: [], otherCommitments: []
    };
    var sports = map.sports || [];
    var sport = null;
    for (var i = 0; i < sports.length; i++) {
      if (sports[i].name === sportName) { sport = sports[i]; break; }
    }
    if (!sport) {
      sport = { name: sportName, isPriority: false, monthlyStates: [] };
      sports.push(sport);
    }
    if (!sport.monthlyStates) sport.monthlyStates = [];
    var found = false;
    for (var j = 0; j < sport.monthlyStates.length; j++) {
      if (sport.monthlyStates[j].month === month) {
        block.month = month;
        sport.monthlyStates[j] = block;
        found = true;
        break;
      }
    }
    if (!found) { block.month = month; sport.monthlyStates.push(block); }
    map.sports = sports;
    return handleSaveYearMap(ss, email, map);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ----- Training_Sessions -----
function apSessionObj(r) {
  return {
    id: r.Session_ID,
    date: apDateStr(r.Date),
    weekStart: apDateStr(r.Week_Start),
    sport: r.Sport || '',
    name: r.Name || '',
    intensity: r.Intensity || '',
    plannedDuration: r.Planned_Duration === '' ? null : Number(r.Planned_Duration),
    rpe: r.RPE === '' ? null : Number(r.RPE),
    duration: r.Duration === '' ? null : Number(r.Duration),
    load: r.Load_au === '' ? null : Number(r.Load_au),
    status: r.Status || 'planned',
    isPB: r.Is_PB === true || r.Is_PB === 'TRUE',
    workout: apParse(r.Planned_JSON, []),
    note: r.Note || ''
  };
}

function handleGetWeek(ss, email, weekStart) {
  try {
    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) return { success: true, sessions: [] };
    var ws = apWeekStart(weekStart || new Date());
    var sheet = apEnsureTrainingSessions(ss);
    var rows = apReadObjects(sheet);
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].Athlete_ID).trim() === String(athleteId).trim() &&
          apDateStr(rows[i].Week_Start) === ws) {
        out.push(apSessionObj(rows[i]));
      }
    }
    return { success: true, weekStart: ws, sessions: out };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleSaveSession(ss, email, session) {
  try {
    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) return { success: false, error: 'No athlete for ' + email };
    var sheet = apEnsureTrainingSessions(ss);
    var id = session.id || Utilities.getUuid();
    var dateStr = apDateStr(session.date || new Date());
    var rpe = (session.rpe === null || session.rpe === undefined || session.rpe === '') ? '' : Number(session.rpe);
    var dur = (session.duration === null || session.duration === undefined || session.duration === '') ? '' : Number(session.duration);
    var load = (rpe !== '' && dur !== '') ? rpe * dur : '';
    var fields = {
      'Session_ID': id,
      'Athlete_ID': athleteId,
      'Date': dateStr,
      'Week_Start': apWeekStart(dateStr),
      'Sport': session.sport || '',
      'Name': session.name || '',
      'Intensity': session.intensity || '',
      'Planned_Duration': (session.plannedDuration === null || session.plannedDuration === undefined || session.plannedDuration === '') ? '' : Number(session.plannedDuration),
      'RPE': rpe,
      'Duration': dur,
      'Load_au': load,
      'Status': session.status || 'planned',
      'Is_PB': session.isPB === true,
      'Planned_JSON': JSON.stringify(session.workout || []),
      'Note': session.note || '',
      'Updated': new Date()
    };
    var rows = apReadObjects(sheet);
    var targetRow = -1;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].Session_ID).trim() === String(id).trim()) { targetRow = rows[i].__row; break; }
    }
    if (targetRow > 0) apUpdateRow(sheet, targetRow, fields);
    else sheet.appendRow(apBuildRow(sheet, fields));
    apCacheClear(athleteId);
    return { success: true, id: id, load: load === '' ? null : load };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ----- Year load aggregates + ACWR -----
function apComputeLoad(ss, athleteId) {
  var sheet = apEnsureTrainingSessions(ss);
  var rows = apReadObjects(sheet);
  var byWeek = {};
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].Athlete_ID).trim() !== String(athleteId).trim()) continue;
    var ws = apDateStr(rows[i].Week_Start);
    if (!ws) continue;
    var l = rows[i].Load_au === '' ? 0 : Number(rows[i].Load_au) || 0;
    byWeek[ws] = (byWeek[ws] || 0) + l;
  }
  var weeks = Object.keys(byWeek).sort();
  var series = [];
  for (var w = 0; w < weeks.length; w++) {
    var acute = byWeek[weeks[w]];
    var sum = 0, n = 0;
    for (var k = Math.max(0, w - 3); k <= w; k++) { sum += byWeek[weeks[k]]; n++; }
    var chronic = n ? sum / n : 0;
    var acwr = chronic > 0 ? acute / chronic : null;
    series.push({ weekStart: weeks[w], load: acute, acwr: acwr });
  }
  var weeksLogged = weeks.length;
  var thisWeekLoad = weeksLogged ? byWeek[weeks[weeksLogged - 1]] : 0;
  var latestAcwr = weeksLogged >= 4 ? series[series.length - 1].acwr : null;
  return { weeks: series, summary: { thisWeekLoad: thisWeekLoad, acwr: latestAcwr, weeksLogged: weeksLogged } };
}

function handleGetYearLoad(ss, email) {
  try {
    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) return { success: true, weeks: [], summary: { thisWeekLoad: 0, acwr: null, weeksLogged: 0 } };
    var cached = apCacheGet('ap_load_' + athleteId);
    if (cached) return { success: true, weeks: cached.weeks, summary: cached.summary };
    var result = apComputeLoad(ss, athleteId);
    apCachePut('ap_load_' + athleteId, result);
    return { success: true, weeks: result.weeks, summary: result.summary };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ----- PBs -----
function apPBObj(r) {
  return {
    sport: r.Sport || '',
    exercise: r.Exercise || '',
    value: r.Value,
    unit: r.Unit || '',
    date: apDateStr(r.Date),
    previousValue: r.Previous_Value === '' ? null : r.Previous_Value,
    note: r.Note || '',
    sessionId: r.Session_ID || ''
  };
}

function handleGetPBs(ss, email) {
  try {
    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) return { success: true, pbs: [] };
    var sheet = apEnsurePBs(ss);
    var rows = apReadObjects(sheet);
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].Athlete_ID).trim() === String(athleteId).trim()) out.push(apPBObj(rows[i]));
    }
    out.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    return { success: true, pbs: out };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleSavePB(ss, email, pb) {
  try {
    var athleteId = lookupAthleteIdByEmail(ss, email);
    if (!athleteId) return { success: false, error: 'No athlete for ' + email };
    var sheet = apEnsurePBs(ss);
    var rows = apReadObjects(sheet);
    var prev = null, prevDate = '';
    var existingRow = -1;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].Athlete_ID).trim() !== String(athleteId).trim()) continue;
      if (pb.sessionId && String(rows[i].Session_ID).trim() === String(pb.sessionId).trim()) existingRow = rows[i].__row;
      if ((rows[i].Sport || '') === (pb.sport || '') && (rows[i].Exercise || '') === (pb.exercise || '')) {
        var d = apDateStr(rows[i].Date);
        if (d >= prevDate) { prevDate = d; prev = rows[i].Value; }
      }
    }
    var fields = {
      'Athlete_ID': athleteId,
      'Sport': pb.sport || '',
      'Exercise': pb.exercise || '',
      'Value': pb.value,
      'Unit': pb.unit || '',
      'Date': apDateStr(pb.date || new Date()),
      'Previous_Value': (pb.previousValue !== undefined && pb.previousValue !== null) ? pb.previousValue : (prev !== null ? prev : ''),
      'Note': pb.note || '',
      'Session_ID': pb.sessionId || '',
      'Updated': new Date()
    };
    if (existingRow > 0) apUpdateRow(sheet, existingRow, fields);
    else sheet.appendRow(apBuildRow(sheet, fields));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ----- Bootstrap: one round-trip for portal open -----
function handleGetPortalBootstrap(ss, email) {
  try {
    var athlete = apGetAthlete(ss, email);
    if (!athlete) return { success: true, athlete: null, firstTime: true };
    var athleteId = athlete.Athlete_ID;
    var map = apLoadYearMap(ss, athleteId);
    if (map) delete map.__row;
    var week = handleGetWeek(ss, email, new Date());
    var load = apComputeLoad(ss, athleteId);
    var pbsRes = handleGetPBs(ss, email);
    return {
      success: true,
      athlete: athlete,
      yearMap: map,
      week: { weekStart: week.weekStart, sessions: week.sessions || [] },
      pbs: pbsRes.pbs || [],
      load: { weeks: load.weeks, summary: load.summary },
      firstTime: !map
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ============================================================
// CLASH OF THE CODES — Block 1: Data layer + scoring engine
// Sheets: Clash_Teams, Clash_Events, Clash_Results. All additive.
// ============================================================

// ----- Sheet ensure helpers -----

function ensureClashTeamsSheet(ss) {
  var sheet = ss.getSheetByName('Clash_Teams');
  // Team Challenge is a whole-team event, so Nom_Game / Volunteers_Game are
  // no longer in this canonical list — ensureClashTeamsSheet won't add them
  // to fresh sheets. If those columns already exist on a sheet from an
  // earlier deploy they're left in place (this helper only adds missing
  // columns; it never removes). Nom_Sprint stays as legacy/unused.
  var headers = [
    'Team', 'Sport', 'Athlete_IDs', 'Chant', 'Colour',
    'Nom_Row', 'Nom_Sprint', 'Nom_Hang',
    'Role_Captain', 'Role_Trainer', 'Role_Manager', 'Role_Nutrition', 'Role_Hype_1', 'Role_Hype_2',
    'Plan_Doc_URL',
    'Volunteers_Row', 'Volunteers_Sprint', 'Volunteers_Hang'
  ];
  if (!sheet) {
    sheet = ss.insertSheet('Clash_Teams');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
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

function ensureClashEventsSheet(ss) {
  var sheet = ss.getSheetByName('Clash_Events');
  var headers = ['Event', 'Type', 'Live', 'Slot', 'Hidden_From_Students', 'Order'];
  if (!sheet) {
    sheet = ss.insertSheet('Clash_Events');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    for (var i = 0; i < headers.length; i++) {
      if (existing.indexOf(headers[i]) === -1) {
        var newCol = Math.max(sheet.getLastColumn() + 1, i + 1);
        sheet.getRange(1, newCol).setValue(headers[i]);
      }
    }
  }
  // Seed the event roster the first time the sheet is created (or left empty).
  if (sheet.getLastRow() < 2) {
    var rows = CLASH_EVENT_SEED.map(function (ev) {
      return [ev.name, ev.type, false, '', !!ev.hidden, ev.order];
    });
    if (rows.length) {
      sheet.getRange(2, 1, rows.length, 6).setValues(rows);
    }
  }
  return sheet;
}

function ensureClashResultsSheet(ss) {
  var sheet = ss.getSheetByName('Clash_Results');
  var headers = ['Timestamp', 'Event', 'Team', 'Athlete_ID', 'Raw_Result',
                 'Attempt_1', 'Attempt_2', 'Cooper_Bands', 'Cooper_Partial_m',
                 'Points', 'Rank', 'Notes'];
  if (!sheet) {
    sheet = ss.insertSheet('Clash_Results');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
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

// ----- Clash of the Codes: staff helper sign-up -----
//
// Open-access (no sign-in) coordination sheet for colleagues helping on the
// day. One row per claim — multi-slot roles (e.g. pool supervision ×3) simply
// hold multiple rows. The Role strings below MUST match the role ids defined
// in clash.html's staff view so pre-claimed leads render as already taken.

// Roles pre-claimed by Scott Bain when the sheet is first created.
var CLASH_HELPER_SEED_ROLES = [
  'Broad Jump — lead',
  'Cooper Run — lead',
  'Tug of War — lead',
  'Relays — lead',
  'Team Challenge — lead',
  'Grit Challenge — lead',
  '100m Row — lead'
];

function ensureClashHelpers(ss) {
  var sheet = ss.getSheetByName('Clash_Helpers');
  var headers = ['Role', 'Helper_Name', 'Timestamp'];
  if (!sheet) {
    sheet = ss.insertSheet('Clash_Helpers');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Seed pre-claimed leads for Scott Bain.
    var now = new Date();
    var seedRows = CLASH_HELPER_SEED_ROLES.map(function (role) {
      return [role, 'Scott Bain', now];
    });
    if (seedRows.length) {
      sheet.getRange(2, 1, seedRows.length, headers.length).setValues(seedRows);
    }
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

// GET — return every helper claim row.
function handleGetHelpers(ss) {
  try {
    var sheet = ensureClashHelpers(ss);
    var ro = clashReadObjects(sheet);
    var helpers = ro.rows
      .filter(function (r) { return String(r.Role || '').trim() !== ''; })
      .map(function (r) {
        return {
          role: String(r.Role || '').trim(),
          name: String(r.Helper_Name || '').trim(),
          timestamp: r.Timestamp || ''
        };
      });
    return { success: true, helpers: helpers };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// POST — claim a helper role (append one row).
function handleClaimHelperRole(ss, data) {
  try {
    var role = String(data.role || '').trim();
    var name = String(data.name || '').trim();
    if (!role || !name) {
      return { success: false, error: 'Missing role or name' };
    }
    var sheet = ensureClashHelpers(ss);
    // Avoid an accidental exact-duplicate (same name already on this role).
    var ro = clashReadObjects(sheet);
    for (var i = 0; i < ro.rows.length; i++) {
      var r = ro.rows[i];
      if (String(r.Role || '').trim().toLowerCase() === role.toLowerCase() &&
          String(r.Helper_Name || '').trim().toLowerCase() === name.toLowerCase()) {
        return { success: true, role: role, name: name, alreadyClaimed: true };
      }
    }
    sheet.appendRow([role, name, new Date()]);
    return { success: true, role: role, name: name };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// POST — release a helper role (delete the first matching row).
function handleUnclaimHelperRole(ss, data) {
  try {
    var role = String(data.role || '').trim();
    var name = String(data.name || '').trim();
    if (!role || !name) {
      return { success: false, error: 'Missing role or name' };
    }
    var sheet = ensureClashHelpers(ss);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: false, error: 'No helpers found' };
    }
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var roleC = headers.indexOf('Role');
    var nameC = headers.indexOf('Helper_Name');
    if (roleC < 0 || nameC < 0) {
      return { success: false, error: 'Required columns missing in Clash_Helpers' };
    }
    var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][roleC] || '').trim().toLowerCase() === role.toLowerCase() &&
          String(values[i][nameC] || '').trim().toLowerCase() === name.toLowerCase()) {
        sheet.deleteRow(i + 2);
        return { success: true, role: role, name: name };
      }
    }
    return { success: false, error: 'Helper claim not found' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ----- Shared helpers -----

function clashReadObjects(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (lastRow < 2) return { headers: headers, rows: [] };
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var rows = data.map(function (row, idx) {
    var obj = { __row: idx + 2 };
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = row[c];
    return obj;
  });
  return { headers: headers, rows: rows };
}

function clashWriteRow(sheet, headers, values, existingRow) {
  if (existingRow > 0) {
    for (var c = 0; c < headers.length; c++) {
      if (Object.prototype.hasOwnProperty.call(values, headers[c])) {
        sheet.getRange(existingRow, c + 1).setValue(values[headers[c]]);
      }
    }
  } else {
    var row = new Array(headers.length);
    for (var c2 = 0; c2 < headers.length; c2++) {
      row[c2] = values[headers[c2]] !== undefined ? values[headers[c2]] : '';
    }
    sheet.appendRow(row);
  }
}

function clashGetAthleteInfo(ss, athleteId) {
  var athletes = ss.getSheetByName('Athletes');
  if (!athletes) return null;
  var data = athletes.getDataRange().getValues();
  if (data.length < 2) return null;
  var hdr = data[0];
  var idC = hdr.indexOf('Athlete_ID');
  if (idC === -1) return null;
  var emC = hdr.indexOf('Email');
  var nC = hdr.indexOf('Name');
  var fnC = hdr.indexOf('First_Name');
  var lnC = hdr.indexOf('Last_Name');
  var gC = hdr.indexOf('Gender');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idC]).trim() === String(athleteId).trim()) {
      var name = '';
      if (nC >= 0 && data[i][nC]) {
        name = String(data[i][nC]);
      } else if (fnC >= 0) {
        name = String(data[i][fnC] || '') + ' ' + (lnC >= 0 ? String(data[i][lnC] || '') : '');
      }
      return {
        id: data[i][idC],
        name: name.trim(),
        email: emC >= 0 ? data[i][emC] : '',
        gender: gC >= 0 ? String(data[i][gC] || '').trim().toUpperCase().charAt(0) : ''
      };
    }
  }
  return null;
}

function clashGetBaseline(ss, athleteId, testKey) {
  var col = CLASH_BASELINE_COLS[testKey];
  if (!col) return null;
  var perf = ss.getSheetByName('Performance');
  if (!perf) return null;
  var data = perf.getDataRange().getValues();
  if (data.length < 2) return null;
  var hdr = data[0];
  var idC = hdr.indexOf('Athlete_ID');
  var dC = hdr.indexOf('Date');
  var vC = hdr.indexOf(col);
  if (idC < 0 || vC < 0) return null;
  var best = null, bestDate = null;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idC]).trim() !== String(athleteId).trim()) continue;
    var v = parseFloat(data[i][vC]);
    if (isNaN(v) || v === 0) continue;
    var d = dC >= 0 ? new Date(data[i][dC]) : null;
    if (best === null || (d && (!bestDate || d > bestDate))) {
      best = v;
      bestDate = d;
    }
  }
  return best;
}

function clashTeamForAthlete(ss, athleteId) {
  var teamsSheet = ensureClashTeamsSheet(ss);
  var data = teamsSheet.getDataRange().getValues();
  if (data.length < 2) return null;
  var hdr = data[0];
  var teamC = hdr.indexOf('Team');
  var idsC = hdr.indexOf('Athlete_IDs');
  if (teamC < 0 || idsC < 0) return null;
  var needle = String(athleteId).trim();
  for (var i = 1; i < data.length; i++) {
    var ids = String(data[i][idsC] || '').split(',').map(function (s) { return s.trim(); });
    if (ids.indexOf(needle) >= 0) return data[i][teamC];
  }
  return null;
}

// ----- Scoring engine -----

function clashImprovementPts(testKey, baseline, newResult) {
  var cfg = CLASH_TESTS[testKey];
  if (!cfg || baseline == null || newResult == null) return 0;
  if (isNaN(baseline) || isNaN(newResult)) return 0;
  var delta = cfg.direction === 'higher' ? (newResult - baseline) : (baseline - newResult);
  if (delta <= 0) return 0;
  var pts = Math.floor(delta / cfg.bandWidth);
  return Math.max(0, Math.min(5, pts));
}

function clashNormPts(testKey, gender, result) {
  var cfg = CLASH_TESTS[testKey];
  if (!cfg || result == null || isNaN(result)) return 1;
  var g = String(gender || '').trim().toUpperCase().charAt(0);
  var thresholds = cfg.norms[g] || cfg.norms.M;
  var score = 1;
  if (cfg.direction === 'higher') {
    for (var i = 0; i < thresholds.length; i++) {
      if (result >= thresholds[i]) score = i + 2;
    }
  } else {
    for (var j = 0; j < thresholds.length; j++) {
      if (result <= thresholds[j]) score = j + 2;
    }
  }
  return Math.max(1, Math.min(5, score));
}

function clashScoreTest(testKey, gender, baseline, newResult) {
  var imp = clashImprovementPts(testKey, baseline, newResult);
  var norm = clashNormPts(testKey, gender, newResult);
  var combined = (imp + norm) / 2;
  return {
    improvement: imp,
    norm: norm,
    score: Math.max(0, Math.min(5, combined))
  };
}

function clashBestResult(testKey, attempt1, attempt2) {
  var cfg = CLASH_TESTS[testKey];
  var have = [];
  if (attempt1 != null && !isNaN(attempt1)) have.push(parseFloat(attempt1));
  if (attempt2 != null && !isNaN(attempt2)) have.push(parseFloat(attempt2));
  if (have.length === 0) return null;
  if (have.length === 1) return have[0];
  if (!cfg) return have[0];
  return cfg.direction === 'higher' ? Math.max(have[0], have[1]) : Math.min(have[0], have[1]);
}

// Recompute Rank + Points for a single event across all rows in Clash_Results.
// Ties share min rank; tied teams split the average of the points slots they cover.
function clashRecomputeEventRanks(sheet, eventName) {
  var dir = CLASH_EVENT_DIRECTIONS[eventName] || 'higher';
  var ro = clashReadObjects(sheet);
  var rows = ro.rows.filter(function (r) { return r.Event === eventName; });
  rows.forEach(function (r) { r.__num = parseFloat(r.Raw_Result); });
  var ranked = rows.filter(function (r) { return !isNaN(r.__num); });
  ranked.sort(function (a, b) {
    return dir === 'higher' ? (b.__num - a.__num) : (a.__num - b.__num);
  });
  var rankCol = ro.headers.indexOf('Rank') + 1;
  var ptsCol = ro.headers.indexOf('Points') + 1;
  var i = 0;
  while (i < ranked.length) {
    var j = i;
    while (j + 1 < ranked.length && ranked[j + 1].__num === ranked[i].__num) j++;
    var ptsSum = 0, slots = 0;
    for (var k = i; k <= j; k++) {
      var p = CLASH_POINTS_BY_RANK[k];
      ptsSum += (p != null ? p : 0);
      slots++;
    }
    var avgPts = slots > 0 ? ptsSum / slots : 0;
    var rankNum = i + 1;
    for (var m = i; m <= j; m++) {
      if (rankCol > 0) sheet.getRange(ranked[m].__row, rankCol).setValue(rankNum);
      if (ptsCol > 0) sheet.getRange(ranked[m].__row, ptsCol).setValue(avgPts);
    }
    i = j + 1;
  }
  // Rows for this event with no numeric result get blank rank/points.
  rows.filter(function (r) { return isNaN(r.__num); }).forEach(function (r) {
    if (rankCol > 0) sheet.getRange(r.__row, rankCol).setValue('');
    if (ptsCol > 0) sheet.getRange(r.__row, ptsCol).setValue('');
  });
}

// Assign rank to an array of {team,...} objects via valueFn. Ties share min rank.
function clashAssignRank(arr, valueFn, dir) {
  arr.forEach(function (x) { x.__val = valueFn(x); });
  arr.sort(function (a, b) {
    return dir === 'higher' ? (b.__val - a.__val) : (a.__val - b.__val);
  });
  var map = {};
  var i = 0;
  while (i < arr.length) {
    var j = i;
    while (j + 1 < arr.length && arr[j + 1].__val === arr[i].__val) j++;
    var rank = i + 1;
    for (var k = i; k <= j; k++) map[arr[k].team] = rank;
    i = j + 1;
  }
  return map;
}

// ----- GET handlers -----

function handleGetClashTeams(ss) {
  try {
    var sheet = ensureClashTeamsSheet(ss);
    var ro = clashReadObjects(sheet);
    var teams = ro.rows.filter(function (r) { return !!r.Team; }).map(function (r) {
      return {
        team: r.Team,
        sport: r.Sport || '',
        athleteIds: String(r.Athlete_IDs || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
        chant: r.Chant || '',
        colour: r.Colour || '',
        nomRow: r.Nom_Row || '',
        nomSprint: r.Nom_Sprint || '',
        nomHang: r.Nom_Hang || '',
        roleCaptain: r.Role_Captain || '',
        roleTrainer: r.Role_Trainer || '',
        roleManager: r.Role_Manager || '',
        roleNutrition: r.Role_Nutrition || '',
        roleHype1: r.Role_Hype_1 || '',
        roleHype2: r.Role_Hype_2 || '',
        planDocUrl: r.Plan_Doc_URL || '',
        volunteersRow: String(r.Volunteers_Row || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
        volunteersSprint: String(r.Volunteers_Sprint || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
        volunteersHang: String(r.Volunteers_Hang || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean)
      };
    });
    return { success: true, teams: teams };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleGetClashEvents(ss, opts) {
  try {
    opts = opts || {};
    var sheet = ensureClashEventsSheet(ss);
    var ro = clashReadObjects(sheet);
    var events = ro.rows.filter(function (r) { return !!r.Event; }).map(function (r) {
      var liveVal = r.Live;
      var hiddenVal = r.Hidden_From_Students;
      return {
        event: r.Event,
        type: r.Type || '',
        live: liveVal === true || String(liveVal).toUpperCase() === 'TRUE',
        slot: r.Slot || '',
        hidden: hiddenVal === true || String(hiddenVal).toUpperCase() === 'TRUE',
        order: parseInt(r.Order, 10) || 0
      };
    });
    if (opts.hideHidden) events = events.filter(function (e) { return !e.hidden; });
    events.sort(function (a, b) { return a.order - b.order; });
    return { success: true, events: events };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleGetClashResults(ss, opts) {
  try {
    opts = opts || {};
    var sheet = ensureClashResultsSheet(ss);
    var ro = clashReadObjects(sheet);
    var rows = ro.rows.filter(function (r) { return !!r.Event; });
    if (opts.event) rows = rows.filter(function (r) { return r.Event === opts.event; });
    if (opts.team) rows = rows.filter(function (r) { return String(r.Team) === String(opts.team); });
    if (opts.athleteId) {
      rows = rows.filter(function (r) {
        return String(r.Athlete_ID).trim() === String(opts.athleteId).trim();
      });
    }
    var out = rows.map(function (r) {
      var copy = {};
      for (var k in r) if (k !== '__row' && Object.prototype.hasOwnProperty.call(r, k)) copy[k] = r[k];
      return copy;
    });
    return { success: true, results: out };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleGetClashLeaderboard(ss) {
  try {
    var teamsSheet = ensureClashTeamsSheet(ss);
    var eventsSheet = ensureClashEventsSheet(ss);
    var resultsSheet = ensureClashResultsSheet(ss);

    var teams = clashReadObjects(teamsSheet).rows.filter(function (r) { return !!r.Team; });
    var events = clashReadObjects(eventsSheet).rows.filter(function (r) { return !!r.Event; });
    var results = clashReadObjects(resultsSheet).rows.filter(function (r) { return !!r.Event; });

    var testKeys = Object.keys(CLASH_TESTS);

    // Group results by event for fast lookup.
    var resByEvent = {};
    results.forEach(function (r) {
      if (!resByEvent[r.Event]) resByEvent[r.Event] = [];
      resByEvent[r.Event].push(r);
    });

    function findFitnessResult(event, athleteId) {
      var bucket = resByEvent[event] || [];
      for (var i = 0; i < bucket.length; i++) {
        if (String(bucket[i].Athlete_ID).trim() === String(athleteId).trim()) return bucket[i];
      }
      return null;
    }

    var standings = teams.map(function (t) {
      var memberIds = String(t.Athlete_IDs || '').split(',')
        .map(function (s) { return s.trim(); })
        .filter(Boolean);

      // Fitness total per athlete = sum of 4 test scores. Excused excluded.
      var memberTotals = [];
      memberIds.forEach(function (aid) {
        var total = 0;
        var excusedCount = 0;
        testKeys.forEach(function (tk) {
          var row = findFitnessResult(tk, aid);
          if (row && String(row.Notes || '').toLowerCase().indexOf('excused') >= 0) {
            excusedCount++;
            return;
          }
          if (row) {
            var p = parseFloat(row.Points);
            total += isNaN(p) ? 1 : p;
          } else {
            total += 1; // missing → 1
          }
        });
        // Only fully-excused athletes (excused on every test) drop out of the team avg.
        if (excusedCount < testKeys.length) memberTotals.push(total);
      });

      var fitnessTeamScore = memberTotals.length
        ? memberTotals.reduce(function (a, b) { return a + b; }, 0) / memberTotals.length
        : 0;

      // Event points: sum Points across all rows for this team in the 10 events.
      var eventPts = 0;
      events.forEach(function (ev) {
        var evRows = (resByEvent[ev.Event] || []).filter(function (r) {
          return String(r.Team).trim() === String(t.Team).trim();
        });
        evRows.forEach(function (r) {
          var p = parseFloat(r.Points);
          if (!isNaN(p)) eventPts += p;
        });
      });

      return {
        team: t.Team,
        sport: t.Sport || '',
        colour: t.Colour || '',
        memberCount: memberIds.length,
        scoredCount: memberTotals.length,
        fitnessScore: fitnessTeamScore,
        eventPoints: eventPts
      };
    });

    var fitMap = clashAssignRank(standings.slice(), function (s) { return s.fitnessScore; }, 'higher');
    var evMap = clashAssignRank(standings.slice(), function (s) { return s.eventPoints; }, 'higher');
    standings.forEach(function (s) {
      s.fitnessRank = fitMap[s.team];
      s.eventRank = evMap[s.team];
      s.combined = (s.fitnessRank || 0) + (s.eventRank || 0);
    });
    var finalMap = clashAssignRank(standings.slice(), function (s) { return s.combined; }, 'lower');
    standings.forEach(function (s) { s.finalRank = finalMap[s.team]; });

    standings.sort(function (a, b) {
      return (a.finalRank || 99) - (b.finalRank || 99);
    });

    return { success: true, standings: standings };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ----- POST handlers -----

var CLASH_TEAM_FIELD_MAP = {
  Team: 'team',
  Sport: 'sport',
  Athlete_IDs: 'athleteIds',
  Chant: 'chant',
  Colour: 'colour',
  Nom_Row: 'nomRow',
  Nom_Sprint: 'nomSprint',
  Nom_Hang: 'nomHang',
  Role_Captain: 'roleCaptain',
  Role_Trainer: 'roleTrainer',
  Role_Manager: 'roleManager',
  Role_Nutrition: 'roleNutrition',
  Role_Hype_1: 'roleHype1',
  Role_Hype_2: 'roleHype2',
  Plan_Doc_URL: 'planDocUrl',
  Volunteers_Row: 'volunteersRow',
  Volunteers_Sprint: 'volunteersSprint',
  Volunteers_Hang: 'volunteersHang'
};

// Role -> column header (Hype is a list resolved at write time).
var CLASH_ROLE_COLS = {
  captain: 'Role_Captain',
  trainer: 'Role_Trainer',
  manager: 'Role_Manager',
  nutrition: 'Role_Nutrition'
};
var CLASH_HYPE_COLS = ['Role_Hype_1', 'Role_Hype_2'];
var CLASH_ALL_ROLE_COLS = ['Role_Captain', 'Role_Trainer', 'Role_Manager', 'Role_Nutrition', 'Role_Hype_1', 'Role_Hype_2'];
var CLASH_VOLUNTEER_COLS = { row: 'Volunteers_Row', sprint: 'Volunteers_Sprint', hang: 'Volunteers_Hang' };

// Display labels used in nomination error messages.
var CLASH_NOM_LABELS = { row: '100 m Row', sprint: '100 m Sprint', hang: 'Grit Challenge' };

function handleSaveClashTeam(ss, data) {
  try {
    if (!data.team) return { success: false, error: 'Missing team name' };
    var sheet = ensureClashTeamsSheet(ss);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var teamC = headers.indexOf('Team');

    var athleteIds = '';
    if (Array.isArray(data.athleteIds)) athleteIds = data.athleteIds.join(',');
    else if (typeof data.athleteIds === 'string') athleteIds = data.athleteIds;

    var fullValues = {
      Team: data.team,
      Sport: data.sport != null ? data.sport : '',
      Athlete_IDs: athleteIds,
      Chant: data.chant != null ? data.chant : '',
      Colour: data.colour != null ? data.colour : '',
      Nom_Row: data.nomRow != null ? data.nomRow : '',
      Nom_Sprint: data.nomSprint != null ? data.nomSprint : '',
      Nom_Hang: data.nomHang != null ? data.nomHang : ''
    };

    // Locate existing row by Team name.
    var targetRow = -1;
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var col = sheet.getRange(2, teamC + 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < col.length; i++) {
        if (String(col[i][0]).trim() === String(data.team).trim()) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow > 0) {
      // Partial update — only write fields that came in on the request.
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c];
        var srcKey = CLASH_TEAM_FIELD_MAP[h];
        if (h === 'Team') {
          sheet.getRange(targetRow, c + 1).setValue(data.team);
        } else if (srcKey && Object.prototype.hasOwnProperty.call(data, srcKey)) {
          sheet.getRange(targetRow, c + 1).setValue(fullValues[h]);
        }
      }
    } else {
      var row = new Array(headers.length);
      for (var c2 = 0; c2 < headers.length; c2++) {
        row[c2] = fullValues[headers[c2]] !== undefined ? fullValues[headers[c2]] : '';
      }
      sheet.appendRow(row);
    }

    return { success: true, team: data.team };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleSaveClashNomination(ss, data) {
  try {
    if (!data.team || !data.slot) return { success: false, error: 'Missing team or slot' };
    var slot = String(data.slot).toLowerCase();
    var slotMap = { row: 'Nom_Row', sprint: 'Nom_Sprint', hang: 'Nom_Hang' };
    var slotCol = slotMap[slot];
    if (!slotCol) return { success: false, error: 'Slot must be row|sprint|hang' };

    var sheet = ensureClashTeamsSheet(ss);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'No teams yet — call saveClashTeam first' };

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var teamC = headers.indexOf('Team');
    var slotC = headers.indexOf(slotCol);
    var capC = headers.indexOf('Role_Captain');
    if (slotC < 0) return { success: false, error: slotCol + ' column missing' };

    var col = sheet.getRange(2, teamC + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < col.length; i++) {
      if (String(col[i][0]).trim() === String(data.team).trim()) {
        var teamRow = i + 2;
        // Captain-only check fires when an athlete email is on the request
        // (i.e. the call came from the student view). The admin/staff scoring
        // station never sends an email, so it stays unrestricted.
        if (data.email) {
          var requesterId = lookupAthleteIdByEmail(ss, data.email);
          var captainId = capC >= 0 ? String(sheet.getRange(teamRow, capC + 1).getValue() || '').trim() : '';
          if (!captainId || !requesterId || String(requesterId).trim() !== captainId) {
            return { success: false, error: 'Only the Captain can confirm a nomination.' };
          }
        }

        // No-double-nomination: a confirmed athlete can only represent the
        // team in one of the three nominated events (row / hang / game).
        // Skip the check when clearing the slot (athleteId === '').
        var newId = String(data.athleteId || '').trim();
        if (newId) {
          // Two live nominated events: 100 m Row and Grit Challenge.
          // Team Challenge is a whole-team event, not a nomination.
          var liveSlots = ['row', 'hang'];
          for (var s = 0; s < liveSlots.length; s++) {
            var otherSlot = liveSlots[s];
            if (otherSlot === slot) continue;
            var otherCol = headers.indexOf(slotMap[otherSlot]);
            if (otherCol < 0) continue;
            var otherId = String(sheet.getRange(teamRow, otherCol + 1).getValue() || '').trim();
            if (otherId && otherId === newId) {
              var info = clashGetAthleteInfo(ss, newId);
              var who = (info && info.name) ? info.name : newId;
              return {
                success: false,
                error: who + ' is already representing the team in ' + CLASH_NOM_LABELS[otherSlot] + ' — each person can only do one.'
              };
            }
          }
        }

        sheet.getRange(teamRow, slotC + 1).setValue(newId);
        return { success: true, team: data.team, slot: slot, athleteId: newId };
      }
    }
    return { success: false, error: 'Team not found: ' + data.team };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ----- Roles, plan doc, volunteers -----

// Locate the {row, sheet, headers} for a team by name, or null.
function clashFindTeamRow(ss, teamName) {
  var sheet = ensureClashTeamsSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var teamC = headers.indexOf('Team');
  if (teamC < 0) return null;
  var col = sheet.getRange(2, teamC + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) {
    if (String(col[i][0]).trim() === String(teamName).trim()) {
      return { sheet: sheet, headers: headers, rowNum: i + 2 };
    }
  }
  return null;
}

function clashReadTeamCell(loc, header) {
  var c = loc.headers.indexOf(header);
  if (c < 0) return '';
  return String(loc.sheet.getRange(loc.rowNum, c + 1).getValue() || '').trim();
}

function clashWriteTeamCell(loc, header, value) {
  var c = loc.headers.indexOf(header);
  if (c < 0) return false;
  loc.sheet.getRange(loc.rowNum, c + 1).setValue(value == null ? '' : value);
  return true;
}

// GET — return the role assignments for one team.
function handleGetTeamRoles(ss, teamName) {
  try {
    if (!teamName) return { success: false, error: 'Missing team' };
    var loc = clashFindTeamRow(ss, teamName);
    if (!loc) return { success: false, error: 'Team not found: ' + teamName };
    return {
      success: true,
      team: teamName,
      roles: {
        captain: clashReadTeamCell(loc, 'Role_Captain'),
        trainer: clashReadTeamCell(loc, 'Role_Trainer'),
        manager: clashReadTeamCell(loc, 'Role_Manager'),
        nutrition: clashReadTeamCell(loc, 'Role_Nutrition'),
        hype1: clashReadTeamCell(loc, 'Role_Hype_1'),
        hype2: clashReadTeamCell(loc, 'Role_Hype_2')
      }
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// POST — claim a role for the requesting athlete. One role per athlete.
function handleClaimRole(ss, data) {
  try {
    if (!data.team || !data.role || !data.email) return { success: false, error: 'Missing team, role or email' };
    var athleteId = lookupAthleteIdByEmail(ss, data.email);
    if (!athleteId) return { success: false, error: 'No athlete found for ' + data.email };
    athleteId = String(athleteId).trim();

    var loc = clashFindTeamRow(ss, data.team);
    if (!loc) return { success: false, error: 'Team not found: ' + data.team };

    // Athlete must be on this team's roster.
    var rosterRaw = clashReadTeamCell(loc, 'Athlete_IDs');
    var roster = rosterRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (roster.indexOf(athleteId) === -1) {
      return { success: false, error: 'You\'re not on this team — can\'t claim a role here.' };
    }

    // Already holds a role? Block (one role per student).
    for (var i = 0; i < CLASH_ALL_ROLE_COLS.length; i++) {
      if (clashReadTeamCell(loc, CLASH_ALL_ROLE_COLS[i]) === athleteId) {
        return { success: false, error: 'You\'re already in a role for this team.' };
      }
    }

    var role = String(data.role).toLowerCase();
    var targetCol = CLASH_ROLE_COLS[role];
    if (role === 'hype') {
      // First empty hype slot wins.
      for (var h = 0; h < CLASH_HYPE_COLS.length; h++) {
        if (!clashReadTeamCell(loc, CLASH_HYPE_COLS[h])) { targetCol = CLASH_HYPE_COLS[h]; break; }
      }
      if (!targetCol || clashReadTeamCell(loc, targetCol)) {
        return { success: false, error: 'Both Hype Squad slots are taken.' };
      }
    } else {
      if (!targetCol) return { success: false, error: 'Unknown role: ' + role };
      if (clashReadTeamCell(loc, targetCol)) {
        return { success: false, error: 'That role is already taken.' };
      }
    }

    clashWriteTeamCell(loc, targetCol, athleteId);
    return { success: true, team: data.team, role: role, slot: targetCol, athleteId: athleteId };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// POST — Captain-only: set the team's planning Google Doc URL.
function handleSetPlanDocUrl(ss, data) {
  try {
    if (!data.team || !data.email) return { success: false, error: 'Missing team or email' };
    var loc = clashFindTeamRow(ss, data.team);
    if (!loc) return { success: false, error: 'Team not found: ' + data.team };
    var requesterId = String(lookupAthleteIdByEmail(ss, data.email) || '').trim();
    var captainId = clashReadTeamCell(loc, 'Role_Captain');
    if (!captainId || !requesterId || requesterId !== captainId) {
      return { success: false, error: 'Only the Captain can update the plan link.' };
    }
    var url = (data.url == null ? '' : String(data.url)).trim();
    clashWriteTeamCell(loc, 'Plan_Doc_URL', url);
    return { success: true, team: data.team, url: url };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// POST — add or remove the requesting athlete from a nomination volunteer list.
function clashUpdateVolunteer(ss, data, mode) {
  if (!data.team || !data.slot || !data.email) return { success: false, error: 'Missing team, slot or email' };
  var slot = String(data.slot).toLowerCase();
  var col = CLASH_VOLUNTEER_COLS[slot];
  if (!col) return { success: false, error: 'Slot must be row|sprint|hang' };
  var loc = clashFindTeamRow(ss, data.team);
  if (!loc) return { success: false, error: 'Team not found: ' + data.team };
  var athleteId = String(lookupAthleteIdByEmail(ss, data.email) || '').trim();
  if (!athleteId) return { success: false, error: 'No athlete found for ' + data.email };
  // Athlete must be on the team.
  var roster = clashReadTeamCell(loc, 'Athlete_IDs').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (roster.indexOf(athleteId) === -1) {
    return { success: false, error: 'You\'re not on this team.' };
  }
  var current = clashReadTeamCell(loc, col).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var idx = current.indexOf(athleteId);
  if (mode === 'add') {
    if (idx === -1) current.push(athleteId);
  } else if (mode === 'remove') {
    if (idx >= 0) current.splice(idx, 1);
  }
  clashWriteTeamCell(loc, col, current.join(','));
  return { success: true, team: data.team, slot: slot, volunteers: current };
}
function handleAddVolunteer(ss, data) {
  try { return clashUpdateVolunteer(ss, data, 'add'); }
  catch (error) { return { success: false, error: error.toString() }; }
}
function handleRemoveVolunteer(ss, data) {
  try { return clashUpdateVolunteer(ss, data, 'remove'); }
  catch (error) { return { success: false, error: error.toString() }; }
}

function handleSaveClashResult(ss, data) {
  try {
    if (!data.event || !data.team) return { success: false, error: 'Missing event or team' };

    var eventsSheet = ensureClashEventsSheet(ss);
    var eventInfo = clashReadObjects(eventsSheet).rows.filter(function (r) {
      return r.Event === data.event;
    })[0];
    if (!eventInfo) return { success: false, error: 'Unknown event: ' + data.event };

    var rawResult = (data.rawResult != null && data.rawResult !== '') ? parseFloat(data.rawResult) : null;
    if (rawResult === null || isNaN(rawResult)) return { success: false, error: 'Missing or invalid rawResult' };

    var sheet = ensureClashResultsSheet(ss);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var nominatedAthlete = eventInfo.Type === 'nominated' ? (data.athleteId || '') : '';

    // Locate any existing row for this event + team (and athlete, if nominated).
    var existing = clashReadObjects(sheet);
    var targetRow = -1;
    for (var i = 0; i < existing.rows.length; i++) {
      var r = existing.rows[i];
      if (r.Event !== data.event) continue;
      if (String(r.Team).trim() !== String(data.team).trim()) continue;
      if (eventInfo.Type === 'nominated') {
        if (String(r.Athlete_ID).trim() === String(nominatedAthlete).trim()) {
          targetRow = r.__row;
          break;
        }
      } else {
        targetRow = r.__row;
        break;
      }
    }

    var values = {
      Timestamp: new Date(),
      Event: data.event,
      Team: data.team,
      Athlete_ID: nominatedAthlete,
      Raw_Result: rawResult,
      Attempt_1: '',
      Attempt_2: '',
      Cooper_Bands: '',
      Cooper_Partial_m: '',
      Points: '',
      Rank: '',
      Notes: data.notes || ''
    };
    clashWriteRow(sheet, headers, values, targetRow);

    // Re-rank this event across all teams so points stay correct on every write.
    clashRecomputeEventRanks(sheet, data.event);

    return { success: true, event: data.event, team: data.team, rawResult: rawResult };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleSaveClashFitnessRetest(ss, data) {
  try {
    if (!data.athleteId || !data.test) return { success: false, error: 'Missing athleteId or test' };
    var testKey = data.test;
    if (!CLASH_TESTS[testKey]) return { success: false, error: 'Unknown test: ' + testKey };

    var info = clashGetAthleteInfo(ss, data.athleteId);
    if (!info) return { success: false, error: 'Athlete not found: ' + data.athleteId };
    var team = clashTeamForAthlete(ss, data.athleteId) || '';

    var sheet = ensureClashResultsSheet(ss);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    function asFloat(v) { return (v != null && v !== '') ? parseFloat(v) : null; }
    function asInt(v) { return (v != null && v !== '') ? parseInt(v, 10) : null; }

    var attempt1 = asFloat(data.attempt1);
    var attempt2 = asFloat(data.attempt2);
    var cooperBands = asInt(data.cooperBands);
    var cooperPartial = asFloat(data.cooperPartial);
    var excused = !!data.excused;

    var rawResult = null;
    if (testKey === 'cooper') {
      if (cooperBands != null || cooperPartial != null) {
        rawResult = (cooperBands || 0) * CLASH_LAP_LENGTH_M + (cooperPartial || 0);
      } else if (attempt1 != null) {
        rawResult = attempt1;
      }
    } else {
      rawResult = clashBestResult(testKey, attempt1, attempt2);
    }

    var notes = data.notes || '';
    var points = '';
    var improvement = null;
    var norm = null;
    var baseline = null;

    if (excused) {
      notes = (notes ? notes + ' ' : '') + '[excused]';
    } else if (rawResult != null && !isNaN(rawResult)) {
      baseline = clashGetBaseline(ss, data.athleteId, testKey);
      var s = clashScoreTest(testKey, info.gender, baseline, rawResult);
      points = s.score;
      improvement = s.improvement;
      norm = s.norm;
    }

    // Locate existing row for this athlete + test (one row per athlete per test).
    var existing = clashReadObjects(sheet);
    var targetRow = -1;
    for (var i = 0; i < existing.rows.length; i++) {
      if (existing.rows[i].Event === testKey &&
          String(existing.rows[i].Athlete_ID).trim() === String(data.athleteId).trim()) {
        targetRow = existing.rows[i].__row;
        break;
      }
    }

    var values = {
      Timestamp: new Date(),
      Event: testKey,
      Team: team,
      Athlete_ID: data.athleteId,
      Raw_Result: rawResult != null && !isNaN(rawResult) ? rawResult : '',
      Attempt_1: attempt1 != null ? attempt1 : '',
      Attempt_2: attempt2 != null ? attempt2 : '',
      Cooper_Bands: cooperBands != null ? cooperBands : '',
      Cooper_Partial_m: cooperPartial != null ? cooperPartial : '',
      Points: points,
      Rank: '',
      Notes: notes
    };
    clashWriteRow(sheet, headers, values, targetRow);

    return {
      success: true,
      test: testKey,
      athleteId: data.athleteId,
      team: team,
      rawResult: rawResult,
      baseline: baseline,
      improvement: improvement,
      norm: norm,
      score: points === '' ? null : points,
      excused: excused
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleSetClashConfig(ss, data) {
  try {
    if (!data.key) return { success: false, error: 'Missing key' };
    var configSheet = ss.getSheetByName('Config');
    if (!configSheet) {
      configSheet = ss.insertSheet('Config');
      configSheet.getRange('A1:B1').setValues([['Key', 'Value']]);
    }
    var key = data.key;
    var value = data.value != null ? data.value : '';
    var range = configSheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < range.length; i++) {
      if (range[i][0] === key) {
        configSheet.getRange(i + 1, 2).setValue(value);
        found = true;
        break;
      }
    }
    if (!found) {
      var lastRow = configSheet.getLastRow();
      configSheet.getRange(lastRow + 1, 1, 1, 2).setValues([[key, value]]);
    }
    return { success: true, key: key, value: value };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ----- Clash_Lunch_Plans (student-facing recovery-lunch planner) -----
// One row per athlete, updated in place on every save. Stored as its own
// sheet (rather than adding per-student columns to Clash_Teams) because the
// data is per-athlete and needs to be capturable for grading later.

function ensureClashLunchPlansSheet(ss) {
  var sheet = ss.getSheetByName('Clash_Lunch_Plans');
  var headers = ['Timestamp', 'Athlete_ID', 'Email', 'Name', 'Team', 'Bringing', 'Why'];
  if (!sheet) {
    sheet = ss.insertSheet('Clash_Lunch_Plans');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
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

function handleGetClashLunchPlan(ss, email, athleteId) {
  try {
    if (!email && !athleteId) return { success: false, error: 'Provide email or athleteId' };
    var aid = athleteId || lookupAthleteIdByEmail(ss, email);
    if (!aid) return { success: true, plan: null };
    var sheet = ensureClashLunchPlansSheet(ss);
    var ro = clashReadObjects(sheet);
    // Most recent row wins (read from bottom up).
    for (var i = ro.rows.length - 1; i >= 0; i--) {
      var r = ro.rows[i];
      if (String(r.Athlete_ID).trim() === String(aid).trim()) {
        return {
          success: true,
          plan: {
            athleteId: r.Athlete_ID,
            email: r.Email || '',
            name: r.Name || '',
            team: r.Team || '',
            bringing: r.Bringing || '',
            why: r.Why || '',
            timestamp: r.Timestamp || null
          }
        };
      }
    }
    return { success: true, plan: null };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleSaveClashLunchPlan(ss, data) {
  try {
    if (!data.email && !data.athleteId) return { success: false, error: 'Missing email or athleteId' };
    var aid = data.athleteId || lookupAthleteIdByEmail(ss, data.email);
    if (!aid) return { success: false, error: 'Athlete not found' };

    var info = clashGetAthleteInfo(ss, aid) || {};
    var team = clashTeamForAthlete(ss, aid) || '';

    var sheet = ensureClashLunchPlansSheet(ss);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var existing = clashReadObjects(sheet);
    var targetRow = -1;
    for (var i = 0; i < existing.rows.length; i++) {
      if (String(existing.rows[i].Athlete_ID).trim() === String(aid).trim()) {
        targetRow = existing.rows[i].__row;
        break;
      }
    }

    var values = {
      Timestamp: new Date(),
      Athlete_ID: aid,
      Email: data.email || info.email || '',
      Name: info.name || '',
      Team: team,
      Bringing: data.bringing || '',
      Why: data.why || ''
    };
    clashWriteRow(sheet, headers, values, targetRow);
    return { success: true, plan: values };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ----- Team-builder helpers -----

// Returns every G9 athlete not currently in any Clash_Teams.Athlete_IDs list.
// Treats Grade and Year_Group as interchangeable, accepts "9", 9, or "G9".
function handleGetUnassignedAthletes(ss) {
  try {
    var athletes = ss.getSheetByName('Athletes');
    if (!athletes) return { success: true, athletes: [] };
    var data = athletes.getDataRange().getValues();
    if (data.length < 2) return { success: true, athletes: [] };
    var hdr = data[0];
    var idC = hdr.indexOf('Athlete_ID');
    var emC = hdr.indexOf('Email');
    var nC = hdr.indexOf('Name');
    var fnC = hdr.indexOf('First_Name');
    var lnC = hdr.indexOf('Last_Name');
    var gC = hdr.indexOf('Gender');
    var grC = hdr.indexOf('Grade');
    var ygC = hdr.indexOf('Year_Group');
    var sport1C = hdr.indexOf('Sport_1');
    var sport2C = hdr.indexOf('Sport_2');
    var sport3C = hdr.indexOf('Sport_3');
    if (idC < 0) return { success: false, error: 'Athlete_ID column missing' };

    function isG9(v) {
      if (v == null) return false;
      var s = String(v).trim().toUpperCase().replace(/^G/, '');
      return s === '9';
    }

    // Build a set of assigned IDs from Clash_Teams.
    var assigned = {};
    var teamsSheet = ss.getSheetByName('Clash_Teams');
    if (teamsSheet) {
      var tData = teamsSheet.getDataRange().getValues();
      if (tData.length >= 2) {
        var tHdr = tData[0];
        var idsC = tHdr.indexOf('Athlete_IDs');
        if (idsC >= 0) {
          for (var t = 1; t < tData.length; t++) {
            String(tData[t][idsC] || '').split(',').forEach(function (s) {
              var id = String(s).trim();
              if (id) assigned[id] = true;
            });
          }
        }
      }
    }

    var out = [];
    for (var i = 1; i < data.length; i++) {
      var aid = data[i][idC];
      if (!aid) continue;
      var key = String(aid).trim();
      if (assigned[key]) continue;

      var gradeVal = grC >= 0 ? data[i][grC] : null;
      var ygVal = ygC >= 0 ? data[i][ygC] : null;
      if (!isG9(gradeVal) && !isG9(ygVal)) continue;

      var name = '';
      if (nC >= 0 && data[i][nC]) {
        name = String(data[i][nC]);
      } else if (fnC >= 0) {
        name = String(data[i][fnC] || '') + ' ' + (lnC >= 0 ? String(data[i][lnC] || '') : '');
      }
      var sports = [];
      [sport1C, sport2C, sport3C].forEach(function (c) {
        if (c >= 0 && data[i][c]) sports.push(String(data[i][c]).trim());
      });

      out.push({
        athleteId: key,
        name: name.trim(),
        email: emC >= 0 ? data[i][emC] : '',
        gender: gC >= 0 ? String(data[i][gC] || '').trim().toUpperCase().charAt(0) : '',
        sports: sports.filter(Boolean)
      });
    }
    out.sort(function (a, b) {
      return (a.name || '').localeCompare(b.name || '');
    });
    return { success: true, athletes: out };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Delete a team row from Clash_Teams by name. No cascade — Clash_Results
// rows for past events remain intact (their Team field still references the
// old name, which is the right behaviour for an audit trail).
function handleDeleteClashTeam(ss, data) {
  try {
    if (!data.team) return { success: false, error: 'Missing team name' };
    var sheet = ss.getSheetByName('Clash_Teams');
    if (!sheet) return { success: false, error: 'Clash_Teams sheet not found' };
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'No teams to delete' };
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var teamC = headers.indexOf('Team');
    if (teamC < 0) return { success: false, error: 'Team column missing' };
    var col = sheet.getRange(2, teamC + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < col.length; i++) {
      if (String(col[i][0]).trim() === String(data.team).trim()) {
        sheet.deleteRow(i + 2);
        return { success: true, team: data.team };
      }
    }
    return { success: false, error: 'Team not found: ' + data.team };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Surface the slice of CLASH config the front-end needs (lap length,
// per-test direction/unit/attempts/bandWidth/norms, sanity thresholds).
// Lets the scoring UI avoid hard-coding lap length or sanity bounds.
function handleGetClashConfig() {
  try {
    var tests = {};
    Object.keys(CLASH_TESTS).forEach(function (k) {
      var t = CLASH_TESTS[k];
      tests[k] = {
        direction: t.direction,
        unit: t.unit,
        bandWidth: t.bandWidth,
        attempts: t.attempts,
        norms: t.norms
      };
    });
    return {
      success: true,
      lapLength: CLASH_LAP_LENGTH_M,
      tests: tests,
      sanity: CLASH_SANITY,
      pointsByRank: CLASH_POINTS_BY_RANK
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
