#!/usr/bin/env node
/**
 * Personal bests in every unit, against real target strings.
 *
 *     node tools/check-pb-units.js   (needs the page served on :8899)
 *
 * The scanner understood kilograms and reps and nothing else, so an athlete who
 * trains conditioning could work all term and own one personal best. A threshold
 * interval taken from 1:30 to 2:00, a 40m sprint, a Cooper distance, a bike at
 * more watts — all real bests, none of them visible.
 *
 * Opening it up is easy. Opening it up WITHOUT inventing bests is the job, and
 * there are three ways to get it wrong:
 *
 *   DIRECTION. Two minutes is a better threshold hold and a worse 400m. Every
 *   time-based case below pins which way that exercise counts.
 *
 *   PRESCRIPTIONS. The exercise library is mostly instructions — "3 × 20m",
 *   "30-60 sec, slow", "tempo 3-2-2", "4–8 × 2–3". Read as achievements they
 *   bury the bests that mean something under "Ankle Hops — 30 sec". Anything
 *   carrying a range, a tempo code, a percentage or a per-side count is refused,
 *   and a first mark in one of the new units is only offered when the student
 *   edited that line during the session.
 *
 *   REST. "4 × 4min @ ~4:20-4:40/km, 3min walk" contains two times. Claiming the
 *   walk would turn a longer rest into progress.
 *
 * The strings below are taken from the real library and from Scott's own week.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:430,height:930} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fails=0; const check=(l,c,d)=>{console.log((c?'  PASS  ':'  FAIL  ')+l+(d?'  — '+d:''));if(!c)fails++;};
  await p.goto('http://127.0.0.1:8899/portal-lab.html?demo=1',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,2200));

  // [name, target line, expected unit or null, expected value or null, style]
  // Style matters for one rule only: a bare rep count is a best in a gym-shaped
  // session and meaningless in a swim or run set ("10×200 @ pace" is ten 200s).
  const CASES = [
    // --- what Scott actually trains -------------------------------------
    ['Curve Reps',       '5 × 2:00 @ 12-13km/h (build toward 15), 2min rest', 's',   120],
    ['Outdoor Intervals','4 × 4min @ ~4:20-4:40/km, 3min walk',               's',   240],
    ['Bike Threshold',   '4 × 5min @ ~230-250W, 3min easy',                   's',   300],
    ['Bike Threshold',   '4 × 5min @ 240W, 3min easy',                        'W',   240],
    ['Row',              '2000m @ 1:52/500m',                                 's/km',112],
    // --- the classics ---------------------------------------------------
    ['Back Squat',       '4 × 5 @ 80kg',                                      'kg',  80, 'strength'],
    ['Pull-up',          '4 × 8',                                             'reps', 8, 'strength'],
    ['Pull-up',          '4 × 8',                                             null, null, 'session'],
    ['40m Sprint',       '40m, 5.82s',                                        's',    5.82],
    ['Cooper',           '12 min, 2480m',                                     'm',    2480],
    ['Broad Jump',       '3 × 1, 212cm best',                                 null,   null],
    ['Plank',            '3 × 60s hold',                                      's',    60],
    ['Farmer Carry',     '3 × 40m carry',                                      'm',   40],
    ['Assault Bike',     '5 × 20cal',                                         'cal',  20],
    // --- library prescriptions that must stay silent --------------------
    ['Ankle Hops',       '30-60 sec, slow',                                   null, null],
    ['A-Skip',           '3 × 20m',                                           'm',   20],
    ['Split Squat',      '4–8 × 2–3 · tempo 3-2-2',                           null, null],
    ['Tempo Squat',      '10 × 2 · tempo 1-2-3',                              null, null],
    ['Z2 Bike',          '4 reps, work:rest 1:1, 70-75% Max HR',              null, null],
    ['Intervals',        '10s on/50s off x2; 40s on/20s off x5',              null, null],
    ['Side Plank',       '1 each leg, 30-60 sec',                             null, null],
    ['Hip Airplane',     '1x1, 30 sec per area',                              null, null],
    ['Sled',             '4 × 3 · ≤30kg',                                     'kg',  30, 'strength'],
    // A line stating a duration AND a speed: the speed is the more specific
    // claim, so that is what a brand new exercise is tracked on.
    ['Curve Reps',       '5 × 2:00 @ 13km/h',                                 'km/h', 13]
  ];

  const out = await p.evaluate((CASES) => {
    const got = CASES.map(c => {
      const cand = pbCandidateFrom({ name:c[0], detail:c[1], exId:null }, c[4] || 'session');
      return { name:c[0], line:c[1], unit: cand && cand.unit, value: cand && cand.value,
               dir: cand ? pbDirFor(cand.unit, c[0], c[1]) : 0,
               text: cand ? pbValueText(cand.value, cand.unit) : '' };
    });
    // Direction, stated per movement rather than assumed.
    const dirs = {
      threshold: pbDirFor('s', 'Curve Reps', '5 × 2:00 @ 13km/h'),
      sprint:    pbDirFor('s', '40m Sprint', '40m, 5.82s'),
      plank:     pbDirFor('s', 'Plank', '3 × 60s hold'),
      pace:      pbDirFor('s/km', 'Row', '2000m @ 1:52/500m'),
      kg:        pbDirFor('kg', 'Back Squat', '4 × 5 @ 80kg')
    };
    // A beat in a lower-is-better unit, end to end through pbScan.
    state.pbs = [{ exercise:'40m Sprint', sport:'Track', value:'6.10', unit:'s' },
                 { exercise:'Curve Reps', sport:'Conditioning', value:'90', unit:'s' }];
    const faster = pbScan({ sport:'Track', date: isoToday(), _checked:[true],
      workout:[{ name:'40m Sprint', detail:'40m, 5.82s', exId:null }] });
    const slower = pbScan({ sport:'Track', date: isoToday(), _checked:[true],
      workout:[{ name:'40m Sprint', detail:'40m, 6.40s', exId:null }] });
    // Already tracked in seconds, and the line also states a speed. It must
    // keep reading seconds rather than silently switching what it measures.
    const longer = pbScan({ sport:'Conditioning', date: isoToday(), _checked:[true],
      workout:[{ name:'Curve Reps', detail:'5 × 2:00 @ 13km/h', exId:null }] });
    // A first mark in a new unit: silent off the plan, offered once edited.
    state.pbs = [];
    const untouched = pbScan({ sport:'Conditioning', date: isoToday(), _checked:[true],
      workout:[{ name:'Curve Reps', detail:'5 × 2:00 @ 13km/h', exId:null }] });
    const edited = pbScan({ sport:'Conditioning', date: isoToday(), _checked:[true],
      workout:[{ name:'Curve Reps', detail:'5 × 2:00 @ 13km/h', exId:null, _edited:true }] });
    const weightMark = pbScan({ sport:'Strength', date: isoToday(), _checked:[true],
      workout:[{ name:'Back Squat', detail:'4 × 5 @ 80kg', exId:null }] });
    return { got, dirs,
      faster: faster.beats.map(x=>x.exercise+' '+x.value),
      slower: slower.beats.length, longer: longer.beats.map(x=>x.exercise+' '+x.value),
      untouched: untouched.marks.length, edited: edited.marks.length,
      weightMark: weightMark.marks.length,
      text: { sec: pbValueText(150,'s'), sprint: pbValueText(5.82,'s'), pace: pbValueText(112,'s/km'),
              kg: pbValueText(80,'kg'), reps: pbValueText(8,'reps'), m: pbValueText(2480,'m') } };
  }, CASES);

  console.log('');
  out.got.forEach((g,i) => {
    const wantU = CASES[i][2], wantV = CASES[i][3];
    const ok = (g.unit||null) === wantU && (wantV === null ? g.value == null : Math.abs(g.value - wantV) < 0.02);
    check((g.name+' — "'+g.line+'"').slice(0,72),
          ok, (g.unit ? g.unit+' '+g.value+'  ('+g.text+')' : 'no claim') +
              (ok ? '' : '   WANTED ' + (wantU ? wantU+' '+wantV : 'no claim')));
  });

  console.log('');
  check('a threshold interval counts UP', out.dirs.threshold === 1);
  check('a 40m sprint counts DOWN', out.dirs.sprint === -1);
  check('a plank hold counts UP', out.dirs.plank === 1);
  check('a pace counts DOWN', out.dirs.pace === -1);
  check('a lift counts UP', out.dirs.kg === 1);

  check('getting faster beats a time best', out.faster.length === 1, out.faster.join());
  check('…and getting slower does not', out.slower === 0, out.slower+' claimed');
  check('holding an interval longer beats a time best', out.longer.length === 1, out.longer.join());
  check('…because an exercise stays on the unit it is already tracked in',
        /Curve Reps 120/.test(out.longer.join()), out.longer.join()||'nothing claimed');

  check('a new unit stays silent on an untouched plan line', out.untouched === 0, out.untouched+' offered');
  check('…and is offered once the student edits it', out.edited === 1, out.edited+' offered');
  check('a weight still marks off the plan as it always did', out.weightMark === 1, out.weightMark+' offered');

  check('a time over a minute reads as a clock', out.text.sec === '2:30', out.text.sec);
  check('…and a sprint keeps its decimals rather than rounding to 0:06',
        out.text.sprint === '5.82s', out.text.sprint);
  check('a pace reads per km', out.text.pace === '1:52/km', out.text.pace);
  check('kilos, reps and metres read plainly',
        out.text.kg==='80 kg' && out.text.reps==='8 reps' && out.text.m==='2480 m',
        [out.text.kg,out.text.reps,out.text.m].join(' · '));
  check('no page errors', errs.length===0, errs.join('; ')||'none');

  await b.close();
  console.log('\n'+(fails?fails+' FAILED':'all passed'));
  process.exit(fails?1:0);
})();
