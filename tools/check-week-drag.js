#!/usr/bin/env node
/**
 * A session can be dragged to a day that is off the bottom of the screen.
 *
 *     node tools/check-week-drag.js        (needs the page served on :8899)
 *
 * Why this exists: a grip drag takes pointer capture and preventDefaults every
 * move, so native scrolling is off for as long as you hold on. With nothing to
 * replace it the only days you could drop onto were the ones already on screen
 * — three or four of seven on a phone — so a session simply could not be moved
 * to Saturday or Sunday. It looked like the drag "stopped working" halfway down.
 *
 * The test holds at the bottom edge without moving the finger, which is the
 * thing that was broken, then completes the gesture the way a person would.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:390,height:780} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fails=0; const check=(l,c,d)=>{console.log((c?'  PASS  ':'  FAIL  ')+l+(d?'  — '+d:''));if(!c)fails++;};
  await p.goto('http://127.0.0.1:8899/portal-lab.html?demo=1', { waitUntil:'load' });
  await new Promise(r=>setTimeout(r,3000));
  for(let i=0;i<40;i++){
    if(!await p.evaluate(()=>document.getElementById('awardPop').classList.contains('open'))) break;
    await p.click('.award-ok'); await new Promise(r=>setTimeout(r,110));
  }

  const setup = await p.evaluate(()=>{
    document.getElementById('weekGrid').scrollIntoView({block:'start'});
    const wraps=[...document.querySelectorAll('#weekGrid .swipe-wrap')];
    const first=wraps[0];
    const days=[...document.querySelectorAll('#weekGrid .day-group')].map(d=>d.getAttribute('data-day'));
    const last=days[days.length-1];
    const lastEl=document.querySelector('.day-group[data-day="'+last+'"]');
    const g=first.querySelector('.plan-grip').getBoundingClientRect();
    return { id:first.getAttribute('data-id'), from:first.getAttribute('data-day'), lastDay:last,
             gripX:Math.round(g.left+g.width/2), gripY:Math.round(g.top+g.height/2),
             lastVisible: lastEl.getBoundingClientRect().top < window.innerHeight,
             scrollY: Math.round(window.scrollY) };
  });
  console.log('  setup: ' + JSON.stringify(setup));
  check('the last day of the week starts off-screen', !setup.lastVisible,
        'if it were visible the bug could not show');

  // Pick the session up and hold near the bottom edge — no further finger movement.
  await p.mouse.move(setup.gripX, setup.gripY);
  await p.mouse.down();
  await p.mouse.move(setup.gripX, 740, { steps: 8 });
  const before = await p.evaluate(()=>Math.round(window.scrollY));
  await new Promise(r=>setTimeout(r,1800));          // hold still at the edge
  const after = await p.evaluate(()=>({ y: Math.round(window.scrollY),
    target: (document.querySelector('.drop-target')||{}).getAttribute
      ? document.querySelector('.drop-target').getAttribute('data-day') : null }));
  console.log('  scrollY ' + before + ' → ' + after.y + ' · target ' + after.target);
  check('the page follows the finger at the edge', after.y > before + 100, before+' → '+after.y);

  // What a person does next: the day they were reaching for is on screen now,
  // so they move onto it and let go.
  const land = await p.evaluate(d=>{
    const el = document.querySelector('.day-group[data-day="'+d+'"]');
    if(!el) return null;
    const r = el.getBoundingClientRect();
    return { x: 180, y: Math.round(r.top + r.height/2), visible: r.top < window.innerHeight };
  }, setup.lastDay);
  console.log('  last day now at: ' + JSON.stringify(land));
  check('the day that was off-screen is now reachable', land && land.visible);
  await p.mouse.move(land.x, land.y, { steps: 6 });
  await new Promise(r=>setTimeout(r,250));
  check('…and highlights as the drop target',
        await p.evaluate(d=>{ const t=document.querySelector('.drop-target');
          return !!t && t.getAttribute('data-day')===d; }, setup.lastDay));
  await p.mouse.up();
  await new Promise(r=>setTimeout(r,600));
  const moved = await p.evaluate(id=>{
    const s=(state.week.sessions||[]).find(x=>x.id===id); return s ? s.date : null;
  }, setup.id);
  console.log('  session moved to: ' + moved);
  check('the session actually lands on the new day', moved && moved !== setup.from,
        setup.from + ' → ' + moved);
  check('the auto-scroll loop stops on release',
        await p.evaluate(async()=>{ const a=window.scrollY; await new Promise(r=>setTimeout(r,500));
          return Math.abs(window.scrollY-a) < 4; }));
  check('no page errors', errs.length===0, errs.join('; ')||'none');
  await b.close();
  console.log('\n' + (fails?fails+' FAILED':'all passed'));
  process.exit(fails?1:0);
})();
