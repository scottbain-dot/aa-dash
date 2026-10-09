#!/usr/bin/env node
/**
 * The training-age model, against a bootstrap shaped like the real one.
 *
 *     node tools/check-training-age-model.js   (needs the page served on :8899)
 *
 * The prototype reads a real athlete's record, which cannot be done from here
 * and should not be. So this feeds it a term of the same shape — a build, a
 * half term, two weeks injured, two improved tests, a block, some stamps — and
 * checks the properties the whole argument rests on:
 *
 *   it never falls, a week you could not train still ages you, a quiet week is
 *   worth less than a trained one, what was carried in from previous years is
 *   kept apart from what this term earned, and a seven-month term cannot report
 *   more than about twice that in growth.
 *
 * The last one is the calibration guard. The first version of this model turned
 * 29 weeks into "1 yr 10 mo", eight months of which were technique stamps
 * earned before September.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const DIR='/tmp/claude-0/-home-user-aa-dash/37334712-512d-5ca7-ae81-1cbd21ae49b3/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:430,height:1000}, deviceScaleFactor:2 });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fails=0; const check=(l,c,d)=>{console.log((c?'  PASS  ':'  FAIL  ')+l+(d?'  — '+d:''));if(!c)fails++;};
  await p.goto('http://127.0.0.1:8899/training-age-prototype.html', { waitUntil:'load' });
  await new Promise(r=>setTimeout(r,800));

  // A bootstrap shaped exactly like the real one: a term from 1 Sept, a holiday,
  // two injured weeks, two improved tests, a block, some stamps.
  const out = await p.evaluate(() => {
    const iso = d => d.toISOString().slice(0,10);
    const mon = new Date(); mon.setDate(mon.getDate()-((mon.getDay()+6)%7));
    const weeks = [], logged = [];
    for(let i = 28; i >= 0; i--){
      const w = new Date(mon); w.setDate(w.getDate() - i*7);
      const ws = iso(w);
      // a realistic term: builds, a thin fortnight, two weeks out injured
      let n = 3;
      if(i === 20 || i === 19) n = 1;            // half term
      if(i === 8 || i === 7) n = 0;              // injured
      if(i < 4) n = 4;
      weeks.push({ weekStart: ws, load: n*300, acwr: null });
      for(let k = 0; k < n; k++){ const d = new Date(w); d.setDate(d.getDate()+k); logged.push(iso(d)); }
    }
    const outFrom = iso(new Date(new Date(mon).setDate(mon.getDate()-8*7)));
    const outTo   = iso(new Date(new Date(mon).setDate(mon.getDate()-7*7+6)));
    DATA = {
      athlete: { Name: 'Test Athlete' },
      load: { weeks, summary: { loggedDates: logged } },
      availability: [{ from: outFrom, to: outTo, kind: 'injured' }],
      testing: [
        { label:'Broad jump', done:true, value:212, unit:'cm', date: iso(new Date(new Date(mon).setDate(mon.getDate()-24*7))), delta:{raw:14, improved:true} },
        { label:'40m sprint', done:true, value:5.82, unit:'s', date: iso(new Date(new Date(mon).setDate(mon.getDate()-6*7))), delta:{raw:0.29, improved:true} },
        { label:'Cooper', done:true, value:2480, unit:'m', date: iso(new Date(new Date(mon).setDate(mon.getDate()-24*7))), delta:null }
      ],
      strengthLevels: [ {pattern:'Squat',tech:4,load:3,done:true}, {pattern:'Push',tech:3,load:2,done:true},
                        {pattern:'Pull',tech:2,load:0,done:true}, {pattern:'Lunge',tech:3,load:3,done:true},
                        {pattern:'Hinge',tech:0,load:0,done:false}, {pattern:'Press',tech:0,load:0,done:false} ],
      learn: { blocks: { fuel: { status:'passed' }, engine: { status:'in_progress' } } }
    };
    document.getElementById('gate').hidden = true;
    document.getElementById('app').hidden = false;
    render();
    const m = build();
    return {
      totalWeeks: Math.round(m.total*10)/10,
      ageText: ageText(m.total),
      datedWeeks: m.series.length,
      trained: m.counts.trainedWeeks,
      strong: m.counts.strongWeeks,
      flagged: m.counts.flaggedWeeks,
      tests: m.counts.tests,
      blocks: m.blocks, stamps: m.stamps,
      carriedMonths: months(m.carried),
      earnedMonths: months(m.earned),
      monotonic: m.series.every((p,i)=> i===0 || p.total >= m.series[i-1].total),
      injuredWeeksStillGained: m.series.filter(p=>p.out).every(p=>p.gain > 0),
      hero: document.querySelector('.ta').textContent.trim(),
      grew: document.querySelector('.grew').textContent.trim(),
      dial: [...document.querySelectorAll('.dl-v')].map(e=>e.textContent),
      warn: !!document.querySelector('.warn'),
      curvePaths: document.querySelectorAll('#curve path').length,
      stepDots: document.querySelectorAll('#curve circle').length,
    };
  });
  console.log(JSON.stringify(out,null,1));
  check('it reads as years and months', /yr|mo/.test(out.ageText), out.ageText);
  check('it never falls', out.monotonic);
  check('an injured week still ages you', out.injuredWeeksStillGained);
  check('a quiet week is worth less than a trained one',
        parseFloat(out.dial[0]) < parseFloat(out.dial[1]), out.dial.join(' < '));
  check('…and a strong week more again', parseFloat(out.dial[1]) < parseFloat(out.dial[2]), out.dial.join(' < '));
  check('the curve draws with step markers', out.curvePaths >= 2 && out.stepDots >= 2,
        out.curvePaths+' paths, '+out.stepDots+' dots');
  check('what was carried in is separated from what was earned',
        out.warn && out.carriedMonths > 0 && out.earnedMonths > 0,
        'carried '+out.carriedMonths+' mo · earned '+out.earnedMonths+' mo');
  check('a term does not read as more growth than the calendar allows',
        out.earnedMonths < out.datedWeeks / 4.345 * 2,
        out.earnedMonths+' mo earned over '+Math.round(out.datedWeeks/4.345)+' months');
  check('tests counted only when they improved', out.tests === 2, out.tests);

  await p.screenshot({ path: DIR+'ta.png', fullPage:true });

  // Changing a rate must move the number.
  const before = out.totalWeeks;
  const after = await p.evaluate(()=>{ setRate('trained', 2.0); const m=build(); return Math.round(m.total*10)/10; });
  check('the rates are live', after > before, before+' → '+after);
  check('no page errors', errs.length===0, errs.join('; ')||'none');
  await b.close();
  console.log('\n'+(fails?fails+' FAILED':'all passed'));
  process.exit(fails?1:0);
})();
