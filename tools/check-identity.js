#!/usr/bin/env node
/**
 * IDENTITY RULE guard (see CLAUDE.md).
 * Portal data ops must be keyed by Athlete_ID only. Email is allowed ONLY in the
 * getPortalBootstrap login call. Run before committing portal changes:
 *     node tools/check-identity.js
 */
const fs = require('fs');
let fail = 0;
const err = m => { console.error('  ✗ ' + m); fail++; };
const ok  = m => console.log('  ✓ ' + m);

// ---- Clients: every student portal keyed by Athlete_ID ----
['portal-lab.html', 'g9-portal.html'].forEach(file => {
  if (!fs.existsSync(file)) return;
  const before = fail;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  // (A) No API call may send an email at all, bootstrap included.
  //
  // This used to allow one exception: the bootstrap login sent
  // `email: currentUser.email`, and the rule was that nothing else could. That
  // exception was itself the hole — ?email=someone@fis.edu returned that
  // student's whole record to anybody, because the server trusted an address
  // the caller typed. Bootstrap now sends the Google credential and the server
  // uses the address Google vouches for, so there is no longer any reason for
  // an email to appear in a request. The guard asserts the stronger rule.
  lines.map((l, i) => ({ l, i }))
    .filter(o => /email:\s*currentUser\.email/.test(o.l))
    .forEach(o => err(`${file}:${o.i + 1} sends an email in an API call — bootstrap takes the Google credential, everything else takes athleteId`));
  // These calls are formatted across several lines in one portal and on one
  // line in the other, so match a short window rather than a single line —
  // a guard that a line break can defeat is not a guard.
  const windowAt = (i, n) => lines.slice(i, i + n).join(' ');

  // The bootstrap call must prove who it is with the credential.
  const bootstraps = lines
    .map((l, i) => ({ l, i }))
    .filter(o => /getPortalBootstrap/.test(o.l) && /api(Get|Post)\(/.test(o.l));
  if (!bootstraps.length) err(`${file}: no getPortalBootstrap call found`);
  bootstraps.filter(o => !/credential:/.test(windowAt(o.i, 4)))
    .forEach(o => err(`${file}:${o.i + 1} bootstrap must send credential: — without it the server cannot tell who is asking`));

  // (A2) Every data call must carry the session token. apiData/apiDataGet attach
  // it centrally, so check the two chokepoints rather than 38 call sites.
  const attachers = lines
    .map((l, i) => ({ l, i }))
    .filter(o => /^\s*function api(Data|DataGet)\s*\(/.test(o.l));
  if (attachers.length !== 2) err(`${file}: expected apiData and apiDataGet to be defined once each, found ${attachers.length}`);
  attachers.filter(o => !/token:\s*sessionToken\(\)/.test(windowAt(o.i, 4)))
    .forEach(o => err(`${file}:${o.i + 1} ${o.l.trim().slice(0, 50)}… does not attach the session token`));
  // (B) no raw apiPost/apiGet for data calls (bootstrap apiGet excepted)
  lines.forEach((l, i) => {
    if (/apiPost\(\{\s*action:/.test(l)) err(`${file}:${i + 1} uses apiPost for a data call — use apiData()`);
    if (/apiGet\(\{\s*action:/.test(l) && !/getPortalBootstrap/.test(l)) err(`${file}:${i + 1} uses apiGet for a data call — use apiDataGet()`);
  });
  if (fail === before) ok(`${file}: no email in any call; bootstrap proves identity with the credential; every data call carries the session token`);
});

// ---- Admin: admin.html must key every API call by Athlete_ID, never email ----
if (fs.existsSync('admin.html')) {
  const before = fail;
  const lines = fs.readFileSync('admin.html', 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (/[?&]email=/.test(l)) err(`admin.html:${i + 1} sends email in a query string — key by athleteId`);
    if (/^\s*email:\s/.test(l) || /\{\s*email:/.test(l)) err(`admin.html:${i + 1} sends email in a request body — key by athleteId`);
  });
  if (fail === before) ok('admin.html: no API call keyed by email');
}

// ---- Server: COMPLETE-APPS-SCRIPT.gs ----
if (fs.existsSync('COMPLETE-APPS-SCRIPT.gs')) {
  const gs = fs.readFileSync('COMPLETE-APPS-SCRIPT.gs', 'utf8');
  const portalHandlers = ['handleGetYearMap','handleGetWeeklyTemplate','handleGetWeek','handleGetGames','handleGetYearLoad',
    'handleGetPBs','handleSaveYearMap','handleSaveBlock','handleSaveWeeklyTemplate','handleSaveSession',
    'handleDeleteSession','handleSavePB','handleGetBookingData','handleBookCheckIn','handleCancelBooking',
    'handleGetLearnProgress','handleSaveLearnProgress','handleGetGrit','handleGetPassport',
    'handleGetAvailability','handleSaveAvailability','handleClearAvailability'];
  // Dispatch must not pass email to these handlers
  portalHandlers.forEach(fn => {
    const re = new RegExp(fn + '\\([^)]*\\.email\\b');
    if (re.test(gs)) err(`dispatch passes email to ${fn}() — must pass athleteId`);
  });
  // Handler bodies must not resolve identity by email
  portalHandlers.forEach(fn => {
    const start = gs.indexOf('\nfunction ' + fn + '(');
    if (start < 0) return;
    const rest = gs.indexOf('\nfunction ', start + 1);
    const body = gs.slice(start, rest < 0 ? gs.length : rest);
    if (/lookupAthleteIdByEmail/.test(body)) err(`${fn}() resolves identity by email — should take athleteId`);
  });
  if (!fail) ok('COMPLETE-APPS-SCRIPT.gs: portal data handlers keyed by athleteId only');
}

// ---------------------------------------------------------------------------
// The route allowlist is wired into BOTH entry points
// ---------------------------------------------------------------------------
// AA_LIVE_ROUTES decides what the deployment answers at all. It is useless if
// something does not call it, and that is exactly how it shipped: the patch
// added the gate to doPost, the edit that added it to doGet was lost when a
// later step in the same script failed before the file was written, and every
// GET route stayed open — getAthleteData by email, ?admin=true for the whole
// roster — through a merge, a deploy and two rounds of "why is it still open".
//
// Nothing caught it because the checking was aimed at the LIST. Whether the
// allowlist held the right names was verified three ways; whether doGet
// consulted it was never asked. So this asks it.
{
  const gs = fs.readFileSync('COMPLETE-APPS-SCRIPT.gs', 'utf8');
  if (gs) {
    const body = fn => {
      const i = gs.indexOf('function ' + fn + '(e) {');
      if (i === -1) return '';
      const j = gs.indexOf('\nfunction ', i + 1);
      return gs.slice(i, j === -1 ? gs.length : j);
    };
    ['doGet', 'doPost'].forEach(entry => {
      const b = body(entry);
      if (!b) { err(`${entry}() not found in COMPLETE-APPS-SCRIPT.gs`); return; }
      if (!/apRouteGate_\s*\(/.test(b)) {
        err(`${entry}() never calls apRouteGate_ — every route it dispatches is open to anyone`);
        return;
      }
      // And it has to run before anything dispatches, or the routes above it
      // are reachable regardless.
      const gateAt = b.search(/apRouteGate_\s*\(/);
      const firstDispatch = b.search(/if \(\s*(?:data\.)?action ===/);
      if (firstDispatch !== -1 && gateAt > firstDispatch)
        err(`${entry}() dispatches a route before apRouteGate_ runs`);
    });
    if (!fail) ok('COMPLETE-APPS-SCRIPT.gs: the route allowlist gates doGet and doPost');
  }
}

console.log(fail
  ? `\nIDENTITY CHECK FAILED (${fail} issue${fail === 1 ? '' : 's'}). Data ops must use Athlete_ID, never email.\n`
  : '\nIDENTITY CHECK PASSED — portal data ops are Athlete_ID only.\n');
process.exit(fail ? 1 : 0);
