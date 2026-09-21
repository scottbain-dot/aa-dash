/**
 * Athlete_ID repair — one-off helpers for the Training Age spreadsheet.
 *
 * Situation this fixes: the Athletes tab was reused for a new cohort (new students
 * typed over old rows, keeping the old Athlete_IDs). Every data tab is keyed by
 * Athlete_ID, so last year's rows now point at the wrong people. Nothing is lost;
 * the rows just need re-keying.
 *
 * HOW TO USE
 *  1. File > Make a copy of the spreadsheet first. Name it "Archive 2025-26". This is
 *     your safety net and the permanent record for students who have left.
 *  2. Extensions > Apps Script on the LIVE spreadsheet. Add a new file, paste this in.
 *  3. Fill REKEY (old id -> new id) for students who are still here under a new id,
 *     and ARCHIVE for old ids whose student has left. Leave DRY_RUN = true.
 *  4. Run checkCollisions(), then rekeyAthletes(), then archiveOldIds(). Read the log
 *     (View > Logs / Execution log). When it looks right, set DRY_RUN = false and run
 *     rekeyAthletes() and archiveOldIds() once more.
 *
 * Both functions touch every tab that has an Athlete_ID header EXCEPT the Athletes
 * roster itself, which you manage by hand. Archived rows get the prefix in
 * ARCHIVE_PREFIX so they can never collide with a live id and can be reversed.
 */

var DRY_RUN = true;

// old id -> new id, for students still on the roster under a new id
var REKEY = {
  // '12': '55',
};

// old ids whose student is no longer on the roster
var ARCHIVE = [
  // '1', '2', '3',
];

var ARCHIVE_PREFIX = 'x2526-';
var SKIP_SHEETS = ['Athletes'];

function rekeyAthletes() {
  var map = {};
  Object.keys(REKEY).forEach(function (k) { map[String(k).trim()] = String(REKEY[k]).trim(); });
  applyIdMap_(map, 'rekey');
}

function archiveOldIds() {
  var map = {};
  ARCHIVE.forEach(function (id) { map[String(id).trim()] = ARCHIVE_PREFIX + String(id).trim(); });
  applyIdMap_(map, 'archive');
}

// Reverse an archive run: strips the prefix again.
function unarchiveOldIds() {
  var map = {};
  ARCHIVE.forEach(function (id) { map[ARCHIVE_PREFIX + String(id).trim()] = String(id).trim(); });
  applyIdMap_(map, 'unarchive');
}

// Before re-keying: does the NEW id already have rows in the tabs the OLD id is in?
// A collision is not fatal (readers take the latest row by Date) but you want to know.
function checkCollisions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  Object.keys(REKEY).forEach(function (oldId) {
    var newId = String(REKEY[oldId]).trim();
    sheets.forEach(function (sh) {
      if (SKIP_SHEETS.indexOf(sh.getName()) >= 0) return;
      var col = idColumn_(sh);
      if (col < 0) return;
      var vals = sh.getRange(2, col + 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
      var oldN = 0, newN = 0;
      vals.forEach(function (r) {
        var v = String(r[0]).trim();
        if (v === String(oldId).trim()) oldN++;
        if (v === newId) newN++;
      });
      if (oldN && newN) Logger.log('COLLISION %s: old %s has %s rows, new %s already has %s rows', sh.getName(), oldId, oldN, newId, newN);
    });
  });
  Logger.log('checkCollisions done');
}

function applyIdMap_(map, label) {
  var keys = Object.keys(map);
  if (!keys.length) { Logger.log('%s: nothing to do, the map is empty', label); return; }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var total = 0;
  ss.getSheets().forEach(function (sh) {
    if (SKIP_SHEETS.indexOf(sh.getName()) >= 0) return;
    var col = idColumn_(sh);
    if (col < 0 || sh.getLastRow() < 2) return;
    var range = sh.getRange(2, col + 1, sh.getLastRow() - 1, 1);
    var vals = range.getValues();
    var changed = 0;
    var out = vals.map(function (r) {
      var v = String(r[0]).trim();
      if (map.hasOwnProperty(v)) { changed++; return [map[v]]; }
      return [r[0]];
    });
    if (changed) {
      Logger.log('%s %s: %s rows %s', DRY_RUN ? '[dry run]' : '', sh.getName(), changed, label);
      if (!DRY_RUN) range.setValues(out);
      total += changed;
    }
  });
  Logger.log('%s: %s rows across all tabs%s', label, total, DRY_RUN ? ' (dry run, nothing written)' : '');
}

function idColumn_(sh) {
  if (sh.getLastRow() < 1 || sh.getLastColumn() < 1) return -1;
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  return headers.map(function (h) { return String(h).trim(); }).indexOf('Athlete_ID');
}
