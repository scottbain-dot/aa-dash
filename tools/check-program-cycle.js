#!/usr/bin/env node
/**
 * A multi-week program and the week the student is actually standing in.
 *
 *     node tools/check-program-cycle.js   (needs the page served on :8899)
 *
 * The week is filled from programSessionsForWeek(ws) — the week of the ROTATION
 * that lands on that calendar Monday. But sessionInTemplate() and
 * upsertTemplateSession() read and wrote state.weeklyTemplate.sessions, which is
 * p.weeks[p.activeWeek]: the week the PROGRAM EDITOR happens to be showing.
 *
 * On a one-week program those are always the same array and nothing is wrong.
 * On a cycle they diverge, with two consequences, both of them silent:
 *
 *   1. Change a target mid-workout and "update your program too?" never
 *      appears, because the session cannot be found in the week being edited.
 *      The student's change lives on that one calendar week and the program
 *      keeps handing them the old target every cycle after.
 *
 *   2. If the names happened to match across weeks so the offer DID appear,
 *      saying yes wrote the change into the editor's week — the wrong one.
 *
 * Scott hit the first one on a 26-week Hyrox build: changed an interval from
 * 1:30 to 2:00 in workout mode and was never asked whether the program should
 * learn it.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:430,height:930} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fails=0; const check=(l,c,d)=>{console.log((c?'  PASS  ':'  FAIL  ')+l+(d?'  — '+d:''));if(!c)fails++;};
  await p.goto('http://127.0.0.1:8899/portal-lab.html?demo=1',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,2500));

  const out = await p.evaluate(() => {
    const today = isoToday();
    const ws = fmtISO(mondayOf(parseISO(today)));
    const dow = dowOf(today);

    // A two-week cycle anchored so that THIS calendar week is cycle week 2
    // (index 1), while the program editor is left sitting on week 1 (index 0) —
    // which is where it sits by default every time the portal loads.
    const wk0 = [{ dow: dow, name:'Easy Week Threshold', sport:'Conditioning', type:'training',
                   intensity:'easy', plannedDuration:30, target:'', workout:[] }];
    const wk1 = [{ dow: dow, name:'Threshold', sport:'Conditioning', type:'training',
                   intensity:'hard', plannedDuration:40, target:'',
                   workout:[{ name:'Curve Reps', detail:'5 × 1:30 @ 12-13km/h', exId:null }] }];
    state.library = { activeId:'p1', programs:[{
      id:'p1', name:'Hyrox Build', autoRepeat:true, activeWeek:0,
      cycleStart: addDays(ws, -7),      // last Monday → this week is index 1
      weeks:[wk0, wk1]
    }]};
    syncTemplateFromLibrary();

    const sess = { id:'sess_thresh', date: today, time:'', type:'training', result:'',
      sport:'Conditioning', name:'Threshold', intensity:'hard', plannedDuration:40,
      rpe:null, duration:null, load:null, status:'planned', isPB:false,
      workout:[{ name:'Curve Reps', detail:'5 × 2:00 @ 12-13km/h', exId:null }],
      _checked:[true], note:'', noticed:'', blocker:'', target:'', readiness:null };

    const p0 = activeProgram();
    const res = {
      cycleIndexForThisWeek: cycleWeekIndexFor(p0, ws),
      editorWeek: p0.activeWeek,
      // the week the calendar was actually filled from
      laidOnThisWeek: programSessionsForWeek(ws).map(x => x.name),
      // the week the editor is showing
      editorShows: templateSessions().map(x => x.name),
      inTemplate: sessionInTemplate(sess)
    };

    // Saying yes to "update your program too?" must land in the cycle week this
    // session belongs to, and must not touch the week being edited.
    upsertTemplateSession(sess);
    res.wk0After = p0.weeks[0].map(x => x.name);
    res.wk1After = p0.weeks[1].map(x => x.name);
    const t = p0.weeks[1].find(x => x.name === 'Threshold');
    res.targetLearned = t && t.workout && t.workout[0] && t.workout[0].detail;
    return res;
  });

  console.log(JSON.stringify(out,null,1));
  check('this calendar week really is the second week of the cycle',
        out.cycleIndexForThisWeek === 1 && out.editorWeek === 0,
        'cycle index '+out.cycleIndexForThisWeek+', editor on week '+(out.editorWeek+1));
  check('the two weeks genuinely differ',
        out.laidOnThisWeek.join()!==out.editorShows.join(),
        'laid on: ['+out.laidOnThisWeek+'] · editor: ['+out.editorShows+']');
  check('the session IS recognised as part of the program', out.inTemplate,
        'sessionInTemplate → '+out.inTemplate);
  check('updating the program writes into the cycle week the session belongs to',
        out.wk1After.filter(n=>n==='Threshold').length === 1,
        'week 2 now: ['+out.wk1After+']');
  check('…and leaves the week being edited alone',
        out.wk0After.length === 1 && out.wk0After[0] === 'Easy Week Threshold',
        'week 1 now: ['+out.wk0After+']');
  check('the new target is what gets learned',
        /2:00/.test(out.targetLearned||''), out.targetLearned);

  // The ordinary case — one week, no rotation — has to behave exactly as before.
  // This is the path almost every student is on, so it carries the regression.
  const one = await p.evaluate(() => {
    const today = isoToday();
    state.library = { activeId:'p1', programs:[{
      id:'p1', name:'Simple', autoRepeat:true, activeWeek:0,
      weeks:[[{ dow: dowOf(today), name:'Pull (Down)', sport:'Strength', type:'training',
                intensity:'moderate', plannedDuration:60, target:'', workout:[] }]]
    }]};
    syncTemplateFromLibrary();
    const sess = { id:'s1', date: today, name:'Pull (Down)', sport:'Strength', type:'training',
      intensity:'moderate', plannedDuration:60, workout:[{name:'Chin-up', detail:'4 × 6', exId:null}],
      status:'planned', target:'', note:'' };
    const found = sessionInTemplate(sess);
    upsertTemplateSession(sess);
    const afterUpsert = templateSessions().length;
    const learned = templateSessions()[0].workout.length;
    const removed = removeTemplateSession(today, 'Pull (Down)');
    return { found, afterUpsert, learned, removed,
             afterRemove: templateSessions().length,
             stillSharedWithProgram: activeProgram().weeks[0].length };
  });
  check('a one-week program still finds its own session', one.found);
  check('…updates in place rather than duplicating', one.afterUpsert === 1, one.afterUpsert+' entries');
  check('…and learns the exercise', one.learned === 1, one.learned+' exercises');
  check('…and can still be removed', one.removed && one.afterRemove === 0,
        'removed '+one.removed+', '+one.afterRemove+' left');
  check('…with the program seeing the removal, not a stale array',
        one.stillSharedWithProgram === 0, one.stillSharedWithProgram+' left in the program');

  check('no page errors', errs.length===0, errs.join('; ')||'none');

  await b.close();
  console.log('\n'+(fails?fails+' FAILED':'all passed'));
  process.exit(fails?1:0);
})();
