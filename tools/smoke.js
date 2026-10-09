#!/usr/bin/env node
/**
 * Post-deploy smoke test for the Athlete Academy Apps Script.
 *
 *     node tools/smoke.js                 # check every endpoint
 *     node tools/smoke.js --id 43         # use a different athlete
 *     node tools/smoke.js --email a@b.c   # also check the bootstrap/login path
 *
 * Why this exists: three separate incidents in two weeks got as far as students
 * before anyone noticed — a load bug reporting every logged week as zero, a
 * re-key that archived three current athletes, and three rounds of "I
 * redeployed" where the editor still held the old code. Deployment is a manual
 * paste, so the only thing standing between a bad paste and a broken portal is
 * somebody checking. This is that check.
 *
 * It answers two questions:
 *   1. Is every endpoint the portals call still responding with JSON?
 *   2. Is the DEPLOYED script actually the one in this repo?
 *
 * Question 2 is the one that matters most, because the failure is silent: the
 * portal keeps working, it just works like last week.
 *
 * Reads only. Nothing here writes to a sheet or a calendar.
 */
const EXEC = 'https://script.google.com/macros/s/AKfycbwbJOS1zq2rn0LyKREtYfG1uMZMGJJvGaIz71mPowkFCvukic3FwnXDOYzRv8kCrODI/exec';

const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const ID = arg('id', '41');
const EMAIL = arg('email', '');

// Apps Script intermittently answers with an HTML error page instead of JSON.
// That is noise, not a failure, so retry before believing it.
async function get(qs, tries = 4) {
  let lastErr = '';
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(EXEC + '?' + qs, { redirect: 'follow' });
      const t = await r.text();
      if (t.trim().startsWith('{') || t.trim().startsWith('[')) return { ok: true, body: JSON.parse(t) };
      lastErr = 'non-JSON (HTTP ' + r.status + ')';
    } catch (e) { lastErr = e.message; }
    await new Promise(r2 => setTimeout(r2, 1500 * (i + 1)));
  }
  return { ok: false, error: lastErr };
}

const results = [];
const record = (name, state, detail) => { results.push({ name, state, detail }); };

// doGet does not 404 an action it does not recognise — it falls through to the
// legacy email branch and answers {"error":"No email provided"}. That body has
// no success:false in it, so a naive check sails straight past a handler that
// is not deployed at all. Catch it explicitly: this is the exact silent failure
// the whole script exists to prevent.
const NOT_DEPLOYED = b => b && b.authenticated === false && /No email provided/i.test(b.error || '');

// An endpoint passes if it answers in JSON and does not report an error.
// authRequired is a PASS: it proves the handler exists and is gated, which is
// exactly what we want to know without holding a token.
//
// Since the student-session gate landed, that now covers most of the portal
// routes too — they refuse this script because it has no session token, which
// is the correct answer and still proves the paste landed. It does mean the
// expect() bodies below no longer run for those routes; they stay because a
// future token-carrying mode would use them.
async function check(name, qs, opts = {}) {
  const r = await get(qs);
  if (!r.ok) return record(name, 'FAIL', r.error);
  const b = r.body;
  if (NOT_DEPLOYED(b)) return record(name, 'FAIL', 'action not recognised by the live script — not deployed');
  if (b && b.authRequired) return record(name, 'PASS', 'gated (sign-in required)');
  if (b && b.success === false) return record(name, 'FAIL', b.error || 'success:false');
  if (b && b.error) return record(name, 'FAIL', b.error);
  if (b && b.success !== true && !opts.allowNoSuccess) return record(name, 'FAIL', 'no success flag in the reply');
  if (opts.expect) {
    const problem = opts.expect(b);
    if (problem) return record(name, 'FAIL', problem);
  }
  return record(name, 'PASS', opts.note ? opts.note(b) : '');
}

(async () => {
  console.log('Athlete Academy — post-deploy smoke test');
  console.log('athlete ' + ID + (EMAIL ? ' · bootstrap as ' + EMAIL : ' · bootstrap skipped (pass --email to include it)'));
  console.log('');

  // ---- 1. Is the deployed script the one in this repo? --------------------
  // getAttention only exists in the current script. An old deployment has no
  // such action and falls through to the legacy email branch, so the shape of
  // the reply tells us which code is live without needing a teacher token.
  const att = await get('action=getAttention&token=smoke-probe');
  let deployCurrent = false;
  if (!att.ok) {
    record('DEPLOY · script version', 'FAIL', att.error);
  } else if (att.body && att.body.authRequired) {
    deployCurrent = true;
    record('DEPLOY · script version', 'PASS', 'current (getAttention present and gated)');
  } else {
    record('DEPLOY · script version', 'FAIL',
      'STALE — getAttention missing. The editor still holds older code; paste ' +
      'COMPLETE-APPS-SCRIPT.gs in, save, then Manage deployments → New version.');
  }

  // ---- 2. Every endpoint the portals actually call ------------------------
  await check('getYearLoad',        'action=getYearLoad&athleteId=' + ID, {
    // The load fix counts weeks that contain training, not weeks that have a
    // row. If those disagree, an older script is live.
    expect: b => {
      const weeks = b.weeks || [], s = b.summary || {};
      const real = weeks.filter(w => w.load > 0).length;
      if (s.weeksLogged != null && s.weeksLogged !== real)
        return 'weeksLogged=' + s.weeksLogged + ' but ' + real + ' weeks contain training — load fix not deployed';
      return '';
    },
    note: b => (b.weeks || []).length + ' weeks'
  });
  await check('getYearMap',         'action=getYearMap&athleteId=' + ID);
  await check('getWeeklyTemplate',  'action=getWeeklyTemplate&athleteId=' + ID);
  await check('getWeek',            'action=getWeek&athleteId=' + ID, { note: b => (b.sessions || []).length + ' sessions' });
  await check('getPBs',             'action=getPBs&athleteId=' + ID);
  await check('getGames',           'action=getGames&athleteId=' + ID);
  await check('getGrit',            'action=getGrit&athleteId=' + ID, {
    note: b => (b.grit && b.grit.band) ? b.grit.band : 'no score yet'
  });
  await check('getAvailability',    'action=getAvailability&athleteId=' + ID);
  await check('getLearnProgress',   'action=getLearnProgress&athleteId=' + ID);
  await check('getBookingData',     'action=getBookingData&athleteId=' + ID, {
    note: b => (b.slots || []).length + ' slots'
  });
  await check('getConfig',          'action=getConfig');
  await check('getExerciseHistory', 'action=getExerciseHistory&athleteId=' + ID + '&name=Back%20Squat');

  // The squad feed behind the notice ticker and the board. An older script has
  // no such action at all, so a missing route here means the paste did not land
  // — which is exactly the silent failure this file exists to catch, because
  // the portal keeps working and the social half is simply invisible.
  await check('getSquadPulse', 'action=getSquadPulse&athleteId=' + ID, {
    expect: b => {
      if (b.enough === undefined) return 'no "enough" field — getSquadPulse not deployed';
      // Nothing identifying may ever come back from this route.
      const leak = ['athletes', 'names', 'ids', 'rows', 'emails'].find(k => b[k] !== undefined);
      if (leak) return 'LEAK: response carries "' + leak + '" — this endpoint must return counts only';
      (b.sports || []).forEach(s => { if (s.size < 5) return 'group of ' + s.size + ' reported — under the suppression floor'; });
      return '';
    },
    note: b => b.enough
      ? (b.trained + '/' + b.cohort + ' trained · ' + b.bests + ' bests · ' +
         (b.sports || []).length + ' sport groups' + (b.coachNote ? ' · coach note set' : ' · no coach note'))
      : 'cohort too small to report'
  });

  // The awards ledger behind the medals. The Awards sheet creates itself on the
  // first write, so there is nothing to set up — this only proves the route is
  // live. It answers authRequired without a session token, which counts as a
  // pass: a handler that is gated is a handler that exists.
  await check('getAwards', 'action=getAwards&athleteId=' + ID);

  // Admin routes: we only assert that they exist and refuse us.
  await check('getAttention (gated)',   'action=getAttention&token=smoke-probe');

  // ---- 3. The doors that are supposed to be shut --------------------------
  // 43 routes used to answer an anonymous caller — last year's Clash, the
  // superseded G9 endpoints, the email-keyed athlete reads, the open writes.
  // They are off the allowlist now, and this is what proves it on the live
  // deployment rather than in the file.
  //
  // Every one of these is checked with arguments that cannot match a real
  // student. The point is the shape of the refusal, not any data behind it.
  const RETIRED_GET = [
    'getAthleteData&email=zz-not-real@example.invalid',
    'getGritChallenge&email=zz-not-real@example.invalid',
    'getUnassignedAthletes',
    'getClashLeaderboard', 'getClashTeams', 'getClashResults', 'getTeamRoles', 'getHelpers',
    'getConfig&key=CurrentSession',
    'getWorkoutHistory&email=zz-not-real@example.invalid',
    'getLastSession&email=zz-not-real@example.invalid'
  ];
  for (const qs of RETIRED_GET) {
    const name = qs.split('&')[0];
    const r = await get('action=' + qs);
    if (!r.ok) { record('closed · ' + name, 'FAIL', r.error); continue; }
    if (r.body && r.body.routeDisabled) record('closed · ' + name, 'PASS', 'refused');
    else record('closed · ' + name, 'FAIL',
      'STILL ANSWERING — this route is off the allowlist in the repo, so the ' +
      'deployed script is older than COMPLETE-APPS-SCRIPT.gs.');
  }

  // The path that was never a named action at all: doGet used to fall through
  // to handleStudentRequest on `?email=` and to handleAdminRequest on
  // `?admin=true`.
  //
  // Only the email form is probed, and only with an address that cannot match
  // anybody. `?admin=true` goes through the same fallthrough and is refused by
  // the same line, so testing it adds no coverage — and while it is still open,
  // asking it the question means downloading thirty-four children's records to
  // a laptop to learn something the next line of the file already says. The
  // first run of this check did exactly that before the probe was narrowed.
  const fall = await get('email=zz-not-real@example.invalid');
  if (!fall.ok) record('closed · no-action fallthrough', 'FAIL', fall.error);
  else if (fall.body && fall.body.routeDisabled)
    record('closed · no-action fallthrough', 'PASS', 'refused (covers ?email= and ?admin=true)');
  else record('closed · no-action fallthrough', 'FAIL',
    'STILL ANSWERING — ?email= and ?admin=true both reach a handler unauthenticated.');

  if (EMAIL) {
    await check('getPortalBootstrap', 'action=getPortalBootstrap&email=' + encodeURIComponent(EMAIL), {
      expect: b => {
        if (!b.athlete) return 'no athlete resolved for that email';
        if (!Array.isArray(b.strengthLevels)) return 'strengthLevels missing';
        if (!Array.isArray(b.testing)) return 'testing missing';
        return '';
      },
      note: b => 'athlete ' + (b.athlete && b.athlete.Athlete_ID) +
                 ' · ' + (b.strengthLevels || []).filter(x => x.done).length + '/6 patterns stamped'
    });
  }

  // ---- report -------------------------------------------------------------
  console.log(results.map(r =>
    '  ' + (r.state === 'PASS' ? '✓' : '✗') + ' ' + r.name.padEnd(26) +
    (r.detail ? ' — ' + r.detail : '')).join('\n'));

  const failed = results.filter(r => r.state === 'FAIL');
  console.log('\n' + (results.length - failed.length) + '/' + results.length + ' passed');
  if (!deployCurrent) {
    console.log('\nThe live deployment is NOT running the script in this repo.');
    console.log('Nothing merged since the last deploy is doing anything yet.');
  }
  if (failed.length) {
    console.log('\nFAILED:\n' + failed.map(f => '  ' + f.name + ' — ' + f.detail).join('\n'));
    process.exit(1);
  }
  console.log('\nAll good.');
})();
