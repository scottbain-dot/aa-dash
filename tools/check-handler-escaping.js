#!/usr/bin/env node
/**
 * Values the athlete types must survive the trip into an inline handler.
 *
 *     node tools/check-handler-escaping.js        (needs the page served on :8899)
 *
 * Why this exists: the portal builds `onclick="editPB('…','…','…')"` by
 * concatenation, and one of those values is an exercise name the athlete types.
 * The first attempt at escaping turned the apostrophe into &#39;, which looks
 * right and does nothing — the browser decodes the attribute BEFORE parsing it
 * as JavaScript, so &#39; is an apostrophe again by the time it matters, and
 * "Farmer's carry" silently broke the edit button.
 *
 * So this does not inspect the escaping. It runs the handler the way the
 * browser does and checks the string that comes out the other side is the one
 * that went in — including for values written to break out of it.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p.goto('http://127.0.0.1:8899/portal-lab.html?demo=1', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 3000));
  for(let i=0;i<40;i++){
    if(!await p.evaluate(() => document.getElementById('awardPop').classList.contains('open'))) break;
    await p.click('.award-ok'); await new Promise(r => setTimeout(r, 110));
  }
  const out = await p.evaluate(() => {
    const names = ["Farmer's carry", "5'10\" reach", "a'); alert(1); ('", "back\\slash'"];
    const res = [];
    for(const n of names){
      state.pbs = [{ id:'t', sessionId:'s1', sport:'Gym', exercise:n, value:'40', unit:'kg', date:isoToday() }];
      cvEditOpen = true; renderCV();
      const code = document.querySelector('.cvd-rowedit').getAttribute('onclick');
      let args = null, err = '';
      try {
        // Parse the handler the way the browser does, capturing the arguments
        // instead of running the real editPB.
        const fn = new Function('editPB', code);
        fn((...a) => { args = a; });
      } catch(e){ err = e.message; }
      res.push({ typed: n, code, got: args, err });
    }
    return res;
  });
  let bad = 0;
  for(const r of out){
    const ok = !r.err && r.got && r.got[2] === r.typed;
    if(!ok) bad++;
    console.log((ok ? '  PASS  ' : '  FAIL  ') + JSON.stringify(r.typed));
    console.log('         onclick: ' + r.code);
    console.log('         parsed : ' + (r.err ? 'ERROR ' + r.err : JSON.stringify(r.got)));
  }
  console.log('\n' + (bad ? bad + ' FAILED' : 'every value survives the round trip intact'));
  await b.close();
  process.exit(bad ? 1 : 0);
})();
