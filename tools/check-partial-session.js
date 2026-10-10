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
  // ---- ONE duration box on screen at a time -------------------------------
  // The sheet asked "How long?" at the top and "Actual duration" further down,
  // both visible on every past session, and only one of them showed on the week
  // row. Two boxes for one question is a guess, not a form.
  const dur = await p.evaluate(async () => {
    const today = isoToday(), fut = addDays(today, 3);
    state.week.sessions = (state.week.sessions||[]).filter(s => s.id!=='d_past' && s.id!=='d_fut').concat([
      { id:'d_past', date: today, type:'training', sport:'Conditioning', name:'Past One',
        intensity:'hard', plannedDuration:40, rpe:null, duration:null, load:null,
        status:'planned', isPB:false, workout:[], _checked:[], note:'', noticed:'',
        blocker:'', target:'', readiness:null, result:'', time:'' },
      { id:'d_fut', date: fut, type:'training', sport:'Strength', name:'Future One',
        intensity:'moderate', plannedDuration:50, rpe:null, duration:null, load:null,
        status:'planned', isPB:false, workout:[], _checked:[], note:'', noticed:'',
        blocker:'', target:'', readiness:null, result:'', time:'' }]);
    switchTab('week'); await new Promise(r=>setTimeout(r,250));
    const look = () => ({
      planned: getComputedStyle(document.getElementById('planDurationWrap')).visibility,
      actual: document.getElementById('durationSection').style.display !== 'none',
      label: document.querySelector('#durationSection .sheet-section-label').textContent });
    openSession('d_past'); await new Promise(r=>setTimeout(r,350));
    const logging = look(); closeSheet(); await new Promise(r=>setTimeout(r,200));
    openSession('d_fut'); await new Promise(r=>setTimeout(r,350));
    const planning = look(); closeSheet(); await new Promise(r=>setTimeout(r,200));
    return { logging, planning };
  });
  check('logging a session shows one duration box, the actual one',
        dur.logging.planned === 'hidden' && dur.logging.actual,
        'planned '+dur.logging.planned+' · actual '+dur.logging.actual);
  check('…and it asks the question in those words', /how long did it take/i.test(dur.logging.label), dur.logging.label);
  check('planning one shows the planned box and not the actual',
        dur.planning.planned === 'visible' && !dur.planning.actual,
        'planned '+dur.planning.planned+' · actual '+dur.planning.actual);

  // ---- a sheet save records what was ticked, as Finish does ---------------
  const sheetTicks = await p.evaluate(async () => {
    const today = isoToday();
    state.week.sessions = (state.week.sessions||[]).filter(s => s.id!=='sh1').concat([{
      id:'sh1', date: today, type:'training', sport:'Conditioning', name:'Sheet Logged',
      intensity:'hard', plannedDuration:40, rpe:null, duration:null, load:null,
      status:'planned', isPB:false,
      workout:[{name:'A',detail:'5 x 2:00',exId:null},{name:'B',detail:'4 x 4min',exId:null},
               {name:'C',detail:'4 x 5min',exId:null}],
      _checked:[true,false,false], note:'', noticed:'', blocker:'', target:'',
      readiness:null, result:'', time:'' }]);
    switchTab('week'); await new Promise(r=>setTimeout(r,250));
    openSession('sh1'); await new Promise(r=>setTimeout(r,350));
    document.getElementById('duration-input').value = '30';
    document.querySelector('#rpe-row .rpe-pip[data-val="8"]').click();
    await saveCurrentSession(); await new Promise(r=>setTimeout(r,600));
    const s = (state.week.sessions||[]).find(x => x.name==='Sheet Logged');
    return { flags: (s.workout||[]).map(x => x.done), duration: s.duration, load: s.load,
             part: sessionPartBit(s) };
  });
  check('a sheet save keeps which steps were done',
        JSON.stringify(sheetTicks.flags) === JSON.stringify([true,false,false]),
        JSON.stringify(sheetTicks.flags));
  check('…so the week row can say so', sheetTicks.part === ' · 1 of 3 done', JSON.stringify(sheetTicks.part));
  check('…and the duration it was given is the one it keeps',
        sheetTicks.duration === 30 && sheetTicks.load === 240,
        sheetTicks.duration+'min · load '+sheetTicks.load);

  // ---- one bad render must not kill every later tap -----------------------
  // quickLogBusy was raised and two renders ran before the try, so anything
  // throwing in a render left the flag up for the life of the page and every
  // later Did it tap was dropped in silence.
  const busy = await p.evaluate(async () => {
    const today = isoToday();
    state.week.sessions = (state.week.sessions||[]).filter(s => s.id!=='q1' && s.id!=='q2').concat([
      { id:'q1', date: today, type:'training', sport:'Strength', name:'First', intensity:'hard',
        plannedDuration:50, rpe:null, duration:null, load:null, status:'planned', isPB:false,
        workout:[], _checked:[], note:'', noticed:'', blocker:'', target:'', readiness:null, result:'', time:'' },
      { id:'q2', date: today, type:'training', sport:'Strength', name:'Second', intensity:'hard',
        plannedDuration:50, rpe:null, duration:null, load:null, status:'planned', isPB:false,
        workout:[], _checked:[], note:'', noticed:'', blocker:'', target:'', readiness:null, result:'', time:'' }]);
    switchTab('week'); await new Promise(r=>setTimeout(r,250));
    const realRender = window.renderBlockBar;
    window.renderBlockBar = () => { throw new Error('a render blew up'); };
    try { await quickLogDone('q1', 6); } catch(e){}
    window.renderBlockBar = realRender;
    await new Promise(r=>setTimeout(r,400));
    await quickLogDone('q2', 6);
    await new Promise(r=>setTimeout(r,500));
    const b = (state.week.sessions||[]).find(x => x.name==='Second');
    return { stuck: quickLogBusy, second: b ? isLogged(b) : null };
  });
  check('a render that throws does not leave the quick log jammed', !busy.stuck, 'busy='+busy.stuck);
  check('…and the next session can still be logged', busy.second === true, 'logged='+busy.second);

  check('no page errors', errs.length===0, errs.join('; ')||'none');

  await p.screenshot({ path: DIR+'partial.png', fullPage:true });
  await b.close();
  console.log('\n'+(fails?fails+' FAILED':'all passed'));
  process.exit(fails?1:0);
})();
