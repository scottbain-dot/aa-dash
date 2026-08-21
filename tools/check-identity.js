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

// ---- Client: portal-lab.html ----
if (fs.existsSync('portal-lab.html')) {
  const lines = fs.readFileSync('portal-lab.html', 'utf8').split('\n');
  // (A) email may appear in an API call ONLY in the bootstrap login
  const emailCalls = lines.map((l, i) => ({ l, i })).filter(o => /email:\s*currentUser\.email/.test(o.l));
  if (!emailCalls.length) err('expected the bootstrap call to send email, found none');
  emailCalls.filter(o => !/getPortalBootstrap/.test(o.l))
    .forEach(o => err(`portal-lab.html:${o.i + 1} sends email to a non-bootstrap endpoint — use apiData()/apiDataGet() (athleteId)`));
  // (B) no raw apiPost/apiGet for data calls (bootstrap apiGet excepted)
  lines.forEach((l, i) => {
    if (/apiPost\(\{\s*action:/.test(l)) err(`portal-lab.html:${i + 1} uses apiPost for a data call — use apiData()`);
    if (/apiGet\(\{\s*action:/.test(l) && !/getPortalBootstrap/.test(l)) err(`portal-lab.html:${i + 1} uses apiGet for a data call — use apiDataGet()`);
  });
  if (!fail) ok('portal-lab.html: email only in bootstrap; all data calls use apiData()/apiDataGet()');
}

// ---- Server: COMPLETE-APPS-SCRIPT.gs ----
if (fs.existsSync('COMPLETE-APPS-SCRIPT.gs')) {
  const gs = fs.readFileSync('COMPLETE-APPS-SCRIPT.gs', 'utf8');
  const portalHandlers = ['handleGetYearMap','handleGetWeeklyTemplate','handleGetWeek','handleGetYearLoad',
    'handleGetPBs','handleSaveYearMap','handleSaveBlock','handleSaveWeeklyTemplate','handleSaveSession',
    'handleDeleteSession','handleSavePB'];
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

console.log(fail
  ? `\nIDENTITY CHECK FAILED (${fail} issue${fail === 1 ? '' : 's'}). Data ops must use Athlete_ID, never email.\n`
  : '\nIDENTITY CHECK PASSED — portal data ops are Athlete_ID only.\n');
process.exit(fail ? 1 : 0);
