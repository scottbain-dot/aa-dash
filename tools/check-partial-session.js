#!/usr/bin/env node
/**
 * Doing one of three things and finishing is a finished session.
 *
 *     node tools/check-partial-session.js   (needs the page served on :8899)
 *
 * A conditioning session often lists three ways to do the same work, and plenty
 * of real sessions get cut short by a busy rack or a sore knee. The portal used
 * to read that back as failure: the label counted "1 / 3", the Finish button
 * only woke at three of three, and the tick state was wiped on finish and never
 * sent anywhere — so a part-done session came back from the server looking like
 * nothing in it had been touched.
 *
 * That combination pushes a student towards ticking things they did not do,
 * which is the opposite of what the logging is for. Honesty has to be the
 * cheaper option. So:
 *
 *   finishing one of three logs the session exactly as finishing three does —
 *   same status, same load, same credit — while what was actually ticked is
 *   kept, shown back, and is still the only thing a personal best can come from.
 *
 * The persistence detail that makes it work: ticks are written onto the workout
 * items, which already ride to the sheet inside Planned_JSON. No new column, no
 * redeploy.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const DIR='/tmp/claude-0/-home-user-aa-dash/37334712-512d-5ca7-ae81-1cbd21ae49b3/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:430,height:930}, deviceScaleFactor:2 });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fails=0; const check=(l,c,d)=>{console.log((c?'  PASS  ':'  FAIL  ')+l+(d?'  — '+d:''));if(!c)fails++;};
  await p.goto('http://127.0.0.1:8899/portal-lab.html?demo=1',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,2200));

  const mk = () => ({
    id:'sess_part', date:'TODAY', time:'', type:'training', result:'',
    sport:'Conditioning', name:'Threshold', intensity:'hard', plannedDuration:40,
    rpe:null, duration:null, load:null, status:'planned', isPB:false,
    workout:[
      { name:'Curve Reps', detail:'5 × 2:00 @ 13km/h', exId:null },
      { name:'Outdoor Intervals', detail:'4 × 4min', exId:null },
      { name:'Bike Threshold', detail:'4 × 5min', exId:null }
    ],
    _checked:[], note:'', noticed:'', blocker:'', target:'', readiness:null
  });

  const out = await p.evaluate(async (mkSrc) => {
    const make = eval('('+mkSrc+')');
    const today = isoToday();
    // Each scenario starts clean: workout progress is mirrored to localStorage
    // so a locked screen never loses it, and that mirror would otherwise carry
    // one scenario's ticks into the next.
    const seed = s => { s.date = today; try { localStorage.removeItem(wktKey(s.id)); } catch(e){} return s; };
    const res = {};

    // --- the labels and the button, as exercises get ticked ----------------
    state.week.sessions = (state.week.sessions||[]).filter(s => s.id!=='sess_part').concat([seed(make())]);
    startWorkout('sess_part');
    const mode = document.getElementById('workoutMode');
    const label = () => document.getElementById('wktProgressLabel').textContent;
    res.labelNone = label();
    res.readyNone = mode.classList.contains('wkt-ready');
    wktToggle(0);
    res.labelOne = label();
    res.readyOne = mode.classList.contains('wkt-ready');
    res.allDoneOne = mode.classList.contains('wkt-all-done');
    wktToggle(1); wktToggle(2);
    res.labelAll = label();
    res.allDoneAll = mode.classList.contains('wkt-all-done');

    // --- finishing one of three -------------------------------------------
    state.week.sessions = state.week.sessions.filter(s => s.id!=='sess_part').concat([seed(make())]);
    startWorkout('sess_part');
    wktToggle(0);
    // The student changed this target to what they actually hit, which is what
    // lets a time be offered as a first best at all.
    wktSession.workout[0]._edited = true;
    wktFinishOpen();
    await wktSaveFinish();
    await new Promise(r=>setTimeout(r,400));
    const partial = (state.week.sessions||[]).find(s => s.id==='sess_part');
    res.partStatus = partial.status;
    res.partLogged = isLogged(partial);
    res.partLoad = partial.load;
    res.partMarks = (partial.workout||[]).map(x => x.done);
    res.partRow = sessionPartBit(partial);

    // --- finishing all three ----------------------------------------------
    state.week.sessions = state.week.sessions.filter(s => s.id!=='sess_part').concat([seed(make())]);
    startWorkout('sess_part');
    wktToggle(0); wktToggle(1); wktToggle(2);
    wktFinishOpen();
    await wktSaveFinish();
    await new Promise(r=>setTimeout(r,400));
    const full = (state.week.sessions||[]).find(s => s.id==='sess_part');
    res.fullStatus = full.status;
    res.fullLoad = full.load;
    res.fullRow = sessionPartBit(full);

    // --- reopening a part-done session, with no local progress left --------
    try { localStorage.removeItem(wktKey('sess_part')); } catch(e){}
    state.week.sessions = state.week.sessions.filter(s => s.id!=='sess_part').concat([partial]);
    delete partial._checked;
    startWorkout('sess_part');
    res.restored = (wktSession._checked||[]).slice();

    // --- a best can still only come from what was ticked -------------------
    const scan = pbScan(partial);
    res.pbSources = scan.marks.concat(scan.beats).map(x => x.exercise);

    // --- and none of it reaches the program -------------------------------
    state.weeklyTemplate = { name:'P', autoRepeat:true, sessions: [] };
    state.library = null;
    upsertTemplateSession(partial);
    res.tplCarries = (templateSessions()[0].workout||[])
      .filter(x => x.done !== undefined || x._edited !== undefined).length;
    return res;
  }, mk.toString());

  console.log(JSON.stringify(out,null,1));

  check('nothing ticked: the button stays asleep', !out.readyNone, out.labelNone);
  check('one tick wakes the Finish button', out.readyOne, out.labelOne);
  check('…and the label stops counting down to three',
        !/^1 \/ 3$/.test(out.labelOne) && /finish/i.test(out.labelOne), out.labelOne);
  check('…without claiming everything is done', !out.allDoneOne);
  check('three of three still says so', out.allDoneAll, out.labelAll);

  check('finishing one of three logs the session', out.partStatus === 'done' && out.partLogged,
        out.partStatus);
  check('…for exactly the same credit as finishing three',
        out.partLoad === out.fullLoad, out.partLoad+' vs '+out.fullLoad);
  check('…while keeping what was actually done',
        JSON.stringify(out.partMarks) === JSON.stringify([true,false,false]),
        JSON.stringify(out.partMarks));
  check('…and saying so on the week', out.partRow === ' · 1 of 3 done', JSON.stringify(out.partRow));
  check('a session done in full adds no such note', out.fullRow === '', JSON.stringify(out.fullRow));

  check('reopening it shows what was done, not an empty list',
        JSON.stringify(out.restored) === JSON.stringify([true,false,false]),
        JSON.stringify(out.restored));
  check('a best can still only come from a ticked exercise',
        out.pbSources.length === 1 && out.pbSources[0] === 'Curve Reps', out.pbSources.join()||'none');
  check('none of that session state leaks into the program', out.tplCarries === 0,
        out.tplCarries+' items carried it');
  check('no page errors', errs.length===0, errs.join('; ')||'none');

  await p.screenshot({ path: DIR+'partial.png', fullPage:true });
  await b.close();
  console.log('\n'+(fails?fails+' FAILED':'all passed'));
  process.exit(fails?1:0);
})();
