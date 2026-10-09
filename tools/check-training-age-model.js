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
 *   it never falls, it never resets across a year boundary, a week you could not
 *   train still ages you, a quiet week is worth less than a trained one, what
 *   was carried in from previous years is kept apart from what this term earned,
 *   and a seven-month term cannot report more than about twice that in growth.
 *
 * The calibration guard is the one that has already caught a real error: the
 * first version of this model turned 29 weeks into "1 yr 10 mo", eight months of
 * which were technique stamps earned before September.
 *
 * Then the two decisions Scott settled, which are the ones a future change is
 * most likely to break without noticing:
 *
 *   PRIOR TRAINING IS CAPPED BY GRADE (0/1/2/3 from Grade 9 to 12), because a
 *   Grade 10 cannot have trained for longer than they have been in high school.
 *   The cap has to bind on the way in, not just in the input's max attribute,
 *   or a stale localStorage value from an older grade walks straight through.
 *
 *   MATURITY IS A FLOOR, NOT A COMPETITOR. The growth term tapers with age and
 *   sex, and must stay small — a year of being alive is not a year of training
 *   age. The guard is that growth never reaches a fifth of what training is
 *   worth, in either direction of the taper, so nobody can turn this into a
 *   number a Grade 12 gets for doing nothing.
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
      athlete: { Name: 'Test Athlete', Athlete_ID: 'TEST01', Grade: 11, Gender: 'M' },
      load: { weeks, summary: { loggedDates: logged } },
      availability: [{ from: outFrom, to: outTo, kind: 'injured' }],
      // `key` is what the real apLoadTesting sends and what the attribute card
      // matches on — a fixture without it silently scores four of the ten zero.
      testing: [
        { key:'broad_jump', label:'Broad jump', done:true, value:212, unit:'cm', date: iso(new Date(new Date(mon).setDate(mon.getDate()-24*7))), delta:{raw:14, improved:true} },
        { key:'sprint_40m', label:'40m sprint', done:true, value:5.82, unit:'s', date: iso(new Date(new Date(mon).setDate(mon.getDate()-6*7))), delta:{raw:0.29, improved:true} },
        { key:'cooper', label:'Cooper', done:true, value:2480, unit:'m', date: iso(new Date(new Date(mon).setDate(mon.getDate()-24*7))), delta:null }
      ],
      mobility: { done:true, score10: 7.8 },
      psych: { done:true, score10: 6.0 },
      grit: { parts: { adherence: { pct: 72 } } },
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
      growthMonths: months(m.tally.growth),
      monotonic: m.series.every((p,i)=> i===0 || p.total >= m.series[i-1].total),
      injuredWeeksStillGained: m.series.filter(p=>p.out).every(p=>p.gain > 0),
      hero: document.querySelector('.ta').textContent.trim(),
      grew: document.querySelector('.grew').textContent.trim(),
      dial: [...document.querySelectorAll('.dl-v')].map(e=>e.textContent),
      warn: !!document.querySelector('.warn'),
      curvePaths: document.querySelectorAll('#curve path').length,
      stepDots: document.querySelectorAll('#curve circle').length,
      // the ten attributes, which survive underneath the one number
      attrRows: document.querySelectorAll('.at').length,
      attrScored: [...document.querySelectorAll('.at')].filter(e=>!e.classList.contains('none')).length,
      // the maturity taper, read straight off the model
      taper: [9,10,11,12].map(g => Math.round(growthMult(GRADE_AGE[g],'M')*100)/100),
      taperF: [9,10,11,12].map(g => Math.round(growthMult(GRADE_AGE[g],'F')*100)/100),
      bands: [...document.querySelectorAll('.mbx-v')].map(e=>parseFloat(e.textContent)),
      myBand: document.querySelectorAll('.mbx.me').length,
      // the biggest the growth term can ever be, anywhere on the curve
      growthCeiling: RATES.growth * Math.max(...Array.from({length:40},(_,i)=>
        Math.max(growthMult(9+i*0.5,'M'), growthMult(9+i*0.5,'F')))),
      // What a hard week is worth, which is what the page's claim is measured
      // against: growth "is never worth more than about a tenth of a hard week".
      hardWeek: RATES.base + RATES.growth + RATES.trained + RATES.strong
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

  // ---- the ten attributes still sit underneath ----------------------------
  check('all ten attributes still render under the number', out.attrRows === 10, out.attrRows+' rows');
  check('…and they score off the same bootstrap', out.attrScored >= 8, out.attrScored+' of 10 scored');

  // ---- maturity is a floor, not a competitor ------------------------------
  check('the growth term tapers with age',
        out.taper[0] > out.taper[3] && out.taper.every((v,i)=> i===0 || v <= out.taper[i-1]),
        'G9→G12 male: '+out.taper.join(' → '));
  check('…and earlier for girls than boys',
        out.taperF.every((v,i)=> v <= out.taper[i]),
        'female: '+out.taperF.join(' → '));
  check('a quiet week is worth less to a Grade 12 than a Grade 9',
        out.bands.length === 4 && out.bands[0] > out.bands[3], out.bands.join(' → ')+' days');
  check('the athlete\'s own grade is marked on the band row', out.myBand === 1, out.myBand);
  // The page tells a reader growth "is never worth more than about a tenth of a
  // hard week". This is that sentence, as a test — at the very top of the taper,
  // the youngest athlete the curve covers, growth still has to be a rounding
  // detail next to a week of training. It is the guard against someone later
  // nudging the rate until age carries the number on its own.
  check('growth never exceeds a tenth or so of a hard week',
        out.growthCeiling < out.hardWeek / 8,
        'tops out at '+out.growthCeiling.toFixed(2)+' of '+out.hardWeek.toFixed(2)+
        ' = '+Math.round(out.growthCeiling/out.hardWeek*100)+'%');
  check('growth is a real contribution, not a rounding error', out.growthMonths > 0, out.growthMonths+' mo');

  await p.screenshot({ path: DIR+'ta.png', fullPage:true });

  // ---- prior training is capped by grade ----------------------------------
  // The cap has to bind inside the model, not only on the input, or a value
  // left in localStorage from another grade walks through unchecked.
  const cap = await p.evaluate(() => {
    const out = {};
    DATA.athlete.Grade = 10;
    try { localStorage.setItem(priorKey(), '9'); } catch(e){}
    PRIOR = null;
    out.staleStorage = priorYears();          // must clamp to the Grade 10 cap of 1
    setPrior(9);
    out.overAsked = priorYears();
    out.g10 = priorCap();
    DATA.athlete.Grade = 12; out.g12 = priorCap();
    DATA.athlete.Grade = 9;  out.g9  = priorCap();
    DATA.athlete.Grade = 11; PRIOR = 2;
    const withPrior = build().total;
    PRIOR = 0;
    const without = build().total;
    out.priorAdds = Math.round((withPrior - without) * 10) / 10;
    render();
    return out;
  });
  check('the grade cap is 0 / 1 / 2 / 3 from Grade 9 up',
        cap.g9 === 0 && cap.g10 === 1 && cap.g12 === 3,
        'G9 '+cap.g9+' · G10 '+cap.g10+' · G12 '+cap.g12);
  check('a stale stored answer is clamped to the current grade',
        cap.staleStorage === 1, '9 yr stored → '+cap.staleStorage);
  check('…and so is an over-cap answer typed in', cap.overAsked === 1, cap.overAsked);
  check('two prior years add two years of training age',
        Math.abs(cap.priorAdds - 104.4) < 1, cap.priorAdds+' weeks');

  // ---- it never resets ----------------------------------------------------
  // Settled: a Grade 12 keeps the two years behind them. A span crossing a
  // New Year must keep climbing straight through it.
  const long = await p.evaluate(() => {
    const iso = d => d.toISOString().slice(0,10);
    const mon = new Date(); mon.setDate(mon.getDate()-((mon.getDay()+6)%7));
    const weeks = [], logged = [];
    for(let i = 79; i >= 0; i--){
      const w = new Date(mon); w.setDate(w.getDate() - i*7);
      weeks.push({ weekStart: iso(w), load: 900, acwr: null });
      for(let k = 0; k < 3; k++){ const d = new Date(w); d.setDate(d.getDate()+k); logged.push(iso(d)); }
    }
    DATA.load = { weeks, summary: { loggedDates: logged } };
    DATA.availability = [];
    PRIOR = 0;
    const m = build();
    const jan = m.series.map((p,i)=>({i, p})).filter(o => /-01-0[1-7]$/.test(o.p.w) || o.p.w.slice(5,7) === '01');
    render();
    return {
      weeks: m.series.length,
      monotonic: m.series.every((p,i)=> i===0 || p.total >= m.series[i-1].total),
      crossedNewYear: jan.length > 0,
      januaryGains: jan.every(o => o.p.gain > 0),
      total: Math.round(m.total*10)/10,
      ageText: ageText(m.total)
    };
  });
  check('an 80-week span crosses a New Year', long.crossedNewYear && long.weeks >= 79,
        long.weeks+' weeks');
  check('it does not reset at the year boundary', long.monotonic && long.januaryGains,
        long.ageText+' over '+long.weeks+' weeks');
  check('eighty weeks reads as more than twenty-nine', long.total > out.totalWeeks,
        out.totalWeeks+' → '+long.total+' weeks');

  // Changing a rate must move the number.
  const before = await p.evaluate(()=> Math.round(build().total*10)/10);
  const after = await p.evaluate(()=>{ setRate('trained', 2.0); const m=build(); return Math.round(m.total*10)/10; });
  check('the rates are live', after > before, before+' → '+after);
  check('no page errors', errs.length===0, errs.join('; ')||'none');
  await b.close();
  console.log('\n'+(fails?fails+' FAILED':'all passed'));
  process.exit(fails?1:0);
})();
