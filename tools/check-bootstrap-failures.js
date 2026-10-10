#!/usr/bin/env node
/**
 * What the portal does when the bootstrap does NOT come back.
 *
 *     node tools/check-bootstrap-failures.js   (needs the page served on :8899)
 *
 * This exists because of a morning spent unable to diagnose a portal that would
 * not load. The error screen threw the error away and said "check your
 * connection" whether the server had timed out, thrown an exception, or sent
 * back a Google sign-in page instead of JSON. Three completely different
 * problems, one useless sentence, and no way for a student to report which one
 * they hit or for anybody to tell from outside.
 *
 * So each failure mode now has to produce its own message, and this holds them
 * there. It stubs the network at the fetch boundary and drives the real
 * startPortal(), so the retry loop, the deadline and the error screen under test
 * are the live code paths rather than a re-implementation of them.
 *
 * The fourth case is the one most easily broken by accident: an expired session
 * must bounce to sign-in on the FIRST reply. It must never retry (pointless —
 * the answer will not change) and must never land on the error screen, which is
 * a dead end a student cannot get out of.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const DIR='/tmp/claude-0/-home-user-aa-dash/37334712-512d-5ca7-ae81-1cbd21ae49b3/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let fails=0; const check=(l,c,d)=>{console.log((c?'  PASS  ':'  FAIL  ')+l+(d?'  — '+d:''));if(!c)fails++;};

  const run = async (name, stub) => {
    const p = await b.newPage({ viewport:{width:430,height:930}, deviceScaleFactor:2 });
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('http://127.0.0.1:8899/portal-lab.html',{waitUntil:'load'});
    await new Promise(r=>setTimeout(r,700));
    const res = await p.evaluate(async (s) => {
      const calls = [];
      window.fetch = (url, opts) => { calls.push(String(url).slice(0,80)); return eval(s)(url, opts, calls.length); };
      currentUser = { email:'x@y.z', credential:'FAKE', loginTime: Date.now(), athleteId:'' };
      try { await startPortal(); } catch(e){}
      await new Promise(r=>setTimeout(r,200));
      const el = document.getElementById('appErrorWhy');
      return {
        calls: calls.length,
        errorShown: document.getElementById('appError').classList.contains('active'),
        why: el && !el.hidden ? el.textContent : '',
        spinner: document.getElementById('appLoading').classList.contains('active')
      };
    }, stub);
    if(errs.length) console.log('    pageerrors: '+errs.join('; '));
    await p.screenshot({path:DIR+'boot-'+name+'.png'});
    await p.close();
    return res;
  };

  // 1. The server threw — success:false with a message, no authRequired.
  const a = await run('server-error',
    `((u,o,n)=> Promise.resolve({ text: ()=>Promise.resolve(JSON.stringify({success:false,error:'Exception: Service Spreadsheets timed out'})) }))`);
  check('a server exception shows the error screen', a.errorShown);
  check('…and repeats what the server actually said',
        /Service Spreadsheets timed out/.test(a.why), a.why);
  check('…after retrying three times', a.calls === 3, a.calls+' calls');
  check('…with the spinner cleared', !a.spinner);

  // 2. Not JSON at all. This is what a broken or un-redeployed script sends, and
  //    it is the one a teacher can act on, so it has to name the remedy.
  const c = await run('bad-json',
    `((u,o,n)=> Promise.resolve({ text: ()=>Promise.resolve('<!DOCTYPE html><html>Google sign-in</html>') }))`);
  check('a non-JSON reply names redeploying as the likely cause',
        c.errorShown && /redeploying/.test(c.why), c.why);

  // 3. The abort path — the one the old screen hid completely.
  const d = await run('timeout',
    `((u,o,n)=> Promise.reject(Object.assign(new Error('aborted'),{name:'AbortError'})))`);
  check('a timeout says the server did not answer in time',
        d.errorShown && /did not answer in time/.test(d.why), d.why);

  // 4. An expired session must go to sign-in, not to the dead end.
  const e = await run('auth-required',
    `((u,o,n)=> Promise.resolve({ text: ()=>Promise.resolve(JSON.stringify({success:false,authRequired:true,error:'Sign in required'})) }))`);
  check('an auth failure does NOT hit the error screen', !e.errorShown,
        'error screen shown: '+e.errorShown);
  check('…and does not retry', e.calls === 1, e.calls+' call(s)');

  // 5. The bootstrap gets a bigger budget than a routine call, because it is the
  //    heaviest request in the app — thirteen-plus sheet reads in one go.
  const p = await b.newPage();
  await p.goto('http://127.0.0.1:8899/portal-lab.html',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,400));
  const budgets = await p.evaluate(()=>({ req: REQ_TIMEOUT, boot: BOOTSTRAP_TIMEOUT, deadline: BOOTSTRAP_DEADLINE }));
  await p.close();
  check('the bootstrap gets longer than a routine call',
        budgets.boot > budgets.req, budgets.req+'ms → '+budgets.boot+'ms');
  check('…and the retries are still bounded',
        budgets.deadline >= budgets.boot && budgets.deadline <= 120000, budgets.deadline+'ms total');

  // ---- which build is this phone running ---------------------------------
  // Three rounds of "it still does not work" were spent not knowing whether the
  // phone had the fix on it yet. Safari keeps a page it already has, so a fix
  // can be live for hours and never be seen.
  const vp = await b.newPage({ viewport:{width:390,height:664} });
  await vp.goto('http://127.0.0.1:8899/portal-lab.html?demo=1',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,2400));
  const ver = await vp.evaluate(async () => {
    switchTab('week');
    await new Promise(r=>setTimeout(r,400));
    const stamp = document.querySelector('.build-stamp');
    const bar = document.getElementById('updateBar');
    const real = window.fetch;
    // same build on the server: no bar
    window.fetch = async () => ({ headers:{ get: () => document.lastModified } });
    await checkForUpdate();
    const quiet = bar.hidden;
    // a newer one: bar
    window.fetch = async () => ({ headers:{ get: () => new Date(Date.now()+600000).toUTCString() } });
    await checkForUpdate();
    const shown = !bar.hidden;
    // a server that says nothing: no bar, no noise
    bar.hidden = true;
    window.fetch = async () => ({ headers:{ get: () => null } });
    await checkForUpdate();
    const silent = bar.hidden;
    window.fetch = real;
    return { stamp: stamp ? stamp.textContent.trim() : null, quiet, shown, silent };
  });
  await vp.close();
  check('the week says which build it is running', /App version \d/.test(ver.stamp||''), ver.stamp);
  check('…and says nothing when it is the current one', ver.quiet);
  check('…offers an update when the server has a newer one', ver.shown);
  check('…and stays quiet when the server will not say', ver.silent);

  await b.close();
  console.log('\n'+(fails?fails+' FAILED':'all passed'));
  process.exit(fails?1:0);
})();
