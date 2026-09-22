#!/usr/bin/env node
/**
 * IDENTITY RULE guard (see CLAUDE.md).
 * Who a request is for comes from the Google ID token the server verifies —
 * never from an email or athleteId the browser typed in. Concretely:
 *   - student pages send `token` with every API call and never send `email`;
 *   - portal data calls go through apiData()/apiDataGet() (Athlete_ID-keyed);
 *   - the Apps Script resolves identity through apStudentGate_ / apAdminGate_
 *     and passes the gate's athleteId (never e.parameter/data.athleteId) to the
 *     portal handlers.
 * Run before committing any portal change:
 *     node tools/check-identity.js
 */
const fs = require('fs');
let fail = 0;
const err = m => { console.error('  ✗ ' + m); fail++; };
const ok  = m => console.log('  ✓ ' + m);

// ---- ID-keyed portals: token on every call, email never, data via apiData() ----
['portal-lab.html', 'g9-portal.html'].forEach(file => {
  if (!fs.existsSync(file)) return;
  const before = fail;
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  // (A) no API call may carry an email — not even the bootstrap login
  lines.forEach((l, i) => {
    if (/api(Get|Post|Data|DataGet)\(\{[^}]*\bemail:/.test(l)) err(`${file}:${i + 1} sends email to the API — identity is the token, never an email`);
    if (/[?&]email=/.test(l)) err(`${file}:${i + 1} sends email in a query string — identity is the token`);
  });
  // (B) the bootstrap login call exists and is token-only
  if (!/apiGet\(\{\s*action:\s*'getPortalBootstrap'\s*\}\)/.test(src)) err(`${file}: expected a token-only getPortalBootstrap call (apiGet({ action:'getPortalBootstrap' }))`);
  // (C) the transport attaches the token to every request
  if (!/function withToken\(/.test(src) || !/token:\s*\(currentUser && currentUser\.token\)/.test(src)) err(`${file}: apiGet/apiPost must attach the Google ID token (withToken)`);
  // (D) no raw apiPost/apiGet for data calls (bootstrap apiGet excepted)
  lines.forEach((l, i) => {
    if (/apiPost\(\{\s*action:/.test(l)) err(`${file}:${i + 1} uses apiPost for a data call — use apiData()`);
    if (/apiGet\(\{\s*action:/.test(l) && !/getPortalBootstrap/.test(l)) err(`${file}:${i + 1} uses apiGet for a data call — use apiDataGet()`);
  });
  if (fail === before) ok(`${file}: token on every call, no email sent, data calls use apiData()/apiDataGet()`);
});

// ---- Other student pages: token instead of email on every API call ----
['index.html', 'strength-portal.html', 'grit-portal.html', 'fuel-lab.html', 'academy-portal.html', 'clash.html'].forEach(file => {
  if (!fs.existsSync(file)) return;
  const before = fail;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (/[?&]email=\$\{/.test(l) || /[?&]email=' \+/.test(l)) err(`${file}:${i + 1} sends email in a query string — send token=`);
    if (/^\s*email:\s*(currentUser|studentState|state)\.(email|athleteId)\b/.test(l)) err(`${file}:${i + 1} sends email in a request body — send token`);
  });
  if (fail === before) ok(`${file}: no API call keyed by email`);
});

// ---- Admin: admin.html must key every API call by Athlete_ID, never email ----
if (fs.existsSync('admin.html')) {
  const before = fail;
  const lines = fs.readFileSync('admin.html', 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (/[?&]email=/.test(l)) err(`admin.html:${i + 1} sends email in a query string — key by athleteId`);
    if (/^\s*email:\s/.test(l) || /\{\s*email:/.test(l)) err(`admin.html:${i + 1} sends email in a request body — key by athleteId`);
    if (/action=getAllStudents/.test(l) && !/token=/.test(l)) err(`admin.html:${i + 1} getAllStudents must carry the teacher token`);
  });
  if (fail === before) ok('admin.html: no API call keyed by email; roster call carries the teacher token');
}

// ---- Server: COMPLETE-APPS-SCRIPT.gs ----
if (fs.existsSync('COMPLETE-APPS-SCRIPT.gs')) {
  const before = fail;
  const gs = fs.readFileSync('COMPLETE-APPS-SCRIPT.gs', 'utf8');
  const portalHandlers = ['handleGetYearMap','handleGetWeeklyTemplate','handleGetWeek','handleGetGames','handleGetYearLoad',
    'handleGetPBs','handleSaveYearMap','handleSaveBlock','handleSaveWeeklyTemplate','handleSaveSession',
    'handleDeleteSession','handleSavePB','handleGetBookingData','handleBookCheckIn','handleCancelBooking',
    'handleGetLearnProgress','handleSaveLearnProgress','handleGetGrit','handleGetPassport',
    'handleGetAvailability','handleSaveAvailability','handleClearAvailability','handleGetExerciseHistory',
    'handleGetGritChallenge','handleSaveGritChallenge','handleSaveCoachFeedback','handleGetClashLunchPlan'];
  // Dispatch must not pass email, nor a client-supplied athleteId, to these handlers
  portalHandlers.forEach(fn => {
    if (new RegExp(fn + '\\([^)]*\\.email\\b').test(gs)) err(`dispatch passes email to ${fn}() — must pass the gate's athleteId`);
    if (new RegExp(fn + '\\([^)]*\\b(e\\.parameter|data)\\.athleteId\\b').test(gs)) err(`dispatch passes the client's athleteId to ${fn}() — must pass who.athleteId from apStudentGate_`);
  });
  // Handler bodies must not resolve identity by email
  portalHandlers.forEach(fn => {
    const start = gs.indexOf('\nfunction ' + fn + '(');
    if (start < 0) return;
    const rest = gs.indexOf('\nfunction ', start + 1);
    const body = gs.slice(start, rest < 0 ? gs.length : rest);
    if (/lookupAthleteIdByEmail/.test(body)) err(`${fn}() resolves identity by email — should take athleteId`);
  });
  // The gates exist and the bootstrap takes the verified email only
  if (!/function apStudentGate_\(/.test(gs)) err('apStudentGate_ is missing — student actions must verify the Google ID token');
  if (!/function apAdminGate_\(/.test(gs)) err('apAdminGate_ is missing — admin actions must verify the teacher token');
  if (/handleGetPortalBootstrap\(ss,\s*e\.parameter\.email/.test(gs)) err('getPortalBootstrap is passed the client email — must use who.email from apStudentGate_');
  if (/action === 'getAllStudents'\)\s*\{\s*return getAllStudents/.test(gs)) err('getAllStudents is open — must sit behind apAdminGate_');
  // Every student action listed for the gate is actually dispatched with it
  ['AP_STUDENT_GET_ACTIONS', 'AP_STUDENT_POST_ACTIONS'].forEach(name => {
    if (!new RegExp(name + '\\.indexOf\\(').test(gs)) err(`${name} is defined but never checked in the dispatcher`);
  });
  if (fail === before) ok('COMPLETE-APPS-SCRIPT.gs: identity comes from the verified token; portal handlers keyed by the gate\'s athleteId');
}

console.log(fail
  ? `\nIDENTITY CHECK FAILED (${fail} issue${fail === 1 ? '' : 's'}). Identity is the verified token; data ops use Athlete_ID, never email.\n`
  : '\nIDENTITY CHECK PASSED — identity is the verified token; portal data ops are Athlete_ID only.\n');
process.exit(fail ? 1 : 0);
