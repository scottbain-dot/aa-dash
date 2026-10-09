#!/usr/bin/env node
/**
 * Finishing a session, by tapping the actual buttons.
 *
 *     node tools/check-finish-not-blocked.js   (needs the page served on :8899)
 *
 * Scott reported twice that a finished session would not show as done. I checked
 * it twice by CALLING wktFinishOpen() and wktSaveFinish() and both times found a
 * sound path — status done, load written, the server storing it correctly — and
 * concluded he had not completed the second tap.
 *
 * He had. The functions were fine and the BUTTON was dead. #awardPop is a
 * full-screen overlay at z-index 400 sitting above workout mode at 300, and
 * while it is open it swallows every tap on the screen underneath. Calling the
 * functions directly walks straight past the thing that was broken, which is
 * why two passes of verification found nothing.
 *
 * So this test clicks. Everything here goes through a real tap at phone size.
 *
 * The overlay got into that state because awardNext() put `.open` on the element
 * and built the card on the NEXT line, with the whole call inside syncAwards'
 * catch — the one commented "never block the week on a medal". Anything throwing
 * in between left the class on, the element empty and the error swallowed: an
 * invisible full-screen tap-blocker over a workout screen that is already
 * near-black. Nothing to see, nothing to dismiss, and the Finish button dead for
 * good. Content is built first now, and a medal that cannot be drawn is skipped.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const DIR='/tmp/claude-0/-home-user-aa-dash/37334712-512d-5ca7-ae81-1cbd21ae49b3/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:390,height:664}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fails=0; const check=(l,c,d)=>{console.log((c?'  PASS  ':'  FAIL  ')+l+(d?'  — '+d:''));if(!c)fails++;};
  await p.goto('http://127.0.0.1:8899/portal-lab.html?demo=1',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,2500));

  const seed = async () => p.evaluate(() => {
    const today = isoToday();
    state.week.sessions = (state.week.sessions||[]).filter(s => s.date !== today).concat([{
      id:'sess_thresh', date: today, time:'', type:'training', result:'',
      sport:'Conditioning', name:'Threshold', intensity:'hard', plannedDuration:40,
      rpe:null, duration:null, load:null, status:'planned', isPB:false,
      workout:[
        { name:'Curve Reps', detail:'5 × 2:00 @ 12-13km/h, 2min rest', exId:null },
        { name:'Outdoor Intervals', detail:'4 × 4min @ ~4:20-4:40/km, 3min walk', exId:null },
        { name:'Bike Threshold', detail:'4 × 5min @ ~230-250W, 3min easy', exId:null }
      ],
      _checked:[], note:'', noticed:'', blocker:'', target:'', readiness:null }]);
    try { localStorage.removeItem(wktKey('sess_thresh')); } catch(e){}
    switchTab('week');
  });

  // ---- a medal is pending, exactly as it is after a sync ------------------
  await seed();
  await p.evaluate(() => {
    // showAwards re-derives the tier from the stored row via awardView, so a
    // hand-made one is filtered out. The queue is what matters here.
    awardQueue = [{ id:'a1', tier:'gold', icon:'ti-medal', title:'New best',
                    label:'Back Squat', line:'A new best', note:'Nice one' }];
    awardNext();
  });
  await new Promise(r=>setTimeout(r,300));
  const popBefore = await p.evaluate(() => document.getElementById('awardPop').classList.contains('open'));
  check('a medal pops when nobody is mid-session', popBefore);

  await p.evaluate(() => startWorkout('sess_thresh'));
  await new Promise(r=>setTimeout(r,400));
  const popDuring = await p.evaluate(() => ({
    open: document.getElementById('awardPop').classList.contains('open'),
    wkt: document.getElementById('workoutMode').classList.contains('open')
  }));
  check('…and gets out of the way when a session starts',
        popDuring.wkt && !popDuring.open, JSON.stringify(popDuring));

  // ---- the whole finish, by tapping ---------------------------------------
  await p.evaluate(() => { const el = document.querySelector('#wktList [onclick*="wktToggle"]'); if(el) el.click(); });
  await new Promise(r=>setTimeout(r,300));
  const ticked = await p.evaluate(() => (wktSession._checked||[]).filter(Boolean).length);
  check('tapping an exercise ticks it', ticked === 1, ticked+' ticked');

  let finishErr = '';
  try { await p.click('#wktFinishBtn', { timeout: 5000 }); }
  catch(e){ finishErr = e.message.split('\n')[0]; }
  await new Promise(r=>setTimeout(r,500));
  const panel = await p.evaluate(() => {
    const btn = document.getElementById('wktSaveBtn');
    const r = btn && btn.getBoundingClientRect();
    return { open: document.getElementById('wktFinishPanel').classList.contains('open'),
             saveOnScreen: r ? (r.top >= 0 && r.bottom <= window.innerHeight) : false };
  });
  check('the Finish button actually takes the tap', !finishErr && panel.open, finishErr||'panel opened');
  check('…and Save workout is on screen, not below the fold', panel.saveOnScreen);

  let saveErr = '';
  try { await p.click('#wktSaveBtn', { timeout: 5000 }); }
  catch(e){ saveErr = e.message.split('\n')[0]; }
  await new Promise(r=>setTimeout(r,900));
  const after = await p.evaluate(() => {
    const s = (state.week.sessions||[]).find(x => x.id==='sess_thresh');
    return { status: s && s.status, logged: s ? isLogged(s) : false, load: s && s.load };
  });
  check('the Save button takes the tap too', !saveErr, saveErr||'clicked');
  check('…and the session comes out logged',
        after.status === 'done' && after.logged, after.status+' · load '+after.load);

  await p.screenshot({ path: DIR+'finish-ok.png' });

  // ---- a medal that cannot be drawn must never leave an open overlay ------
  const broken = await p.evaluate(() => {
    awardPopClose();
    const real = window.escArg;
    window.escArg = () => { throw new Error('boom'); };
    let threw = false;
    try {
      awardQueue = [{ id:'bad', tier:'gold', label:'X', line:'X' }];
      awardNext();
    } catch(e){ threw = true; }
    window.escArg = real;
    const el = document.getElementById('awardPop');
    return { open: el.classList.contains('open'), html: el.innerHTML.length, threw };
  });
  check('a medal that throws while being drawn never opens the overlay',
        !broken.open && broken.html === 0,
        'open: '+broken.open+', html: '+broken.html+' chars');

  // ---- a celebration left up must not kill the NEXT session --------------
  // Saving the first one opened a streak card and a badge card, both of them
  // full-screen and both above workout mode. Nothing was dismissed, which is
  // exactly what a student does when they put the phone down mid-celebration.
  await seed();
  await new Promise(r=>setTimeout(r,400));
  let reopenErr = '';
  try {
    await p.evaluate(() => startWorkout('sess_thresh'));
    await p.waitForTimeout(300);
    await p.click('#wktFinishBtn', { timeout: 5000 });
  } catch(e){ reopenErr = e.message.split('\n')[0]; }
  check('the portal is not left dead behind a stuck overlay', !reopenErr, reopenErr||'still usable');

  check('no page errors', errs.length===0, errs.join('; ')||'none');
  await b.close();
  console.log('\n'+(fails?fails+' FAILED':'all passed'));
  process.exit(fails?1:0);
})();
