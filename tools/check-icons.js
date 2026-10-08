#!/usr/bin/env node
/**
 * Every icon on screen is really in the font.
 *
 *     node tools/check-icons.js
 *     node tools/check-icons.js --refresh    # re-pull the name list from the CDN
 *
 * Why this exists: the portal asked for `ti-flame-filled` on the consistency
 * tile, `ti-flag-checkered` on the Finish workout button, and three more. None
 * of them are in the free Tabler webfont the page loads — the filled variants
 * simply do not ship in it. A missing glyph does not error, does not warn and
 * does not fall back. It renders as nothing, so the button keeps its circle and
 * loses its picture, and the only way anyone finds out is a student saying the
 * flame is gone.
 *
 * The name list is vendored so this runs offline and gives the same answer
 * every time. --refresh updates it when the font version moves.
 */
const fs = require('fs');
const path = require('path');
const NAMES = path.join(__dirname, 'tabler-icon-names.txt');
const CDN = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
const FILES = process.argv.filter(a => /\.html$/.test(a));
const TARGETS = FILES.length ? FILES : ['portal-lab.html', 'g9-portal.html', 'admin.html'];

async function refresh(){
  const css = await (await fetch(CDN)).text();
  const names = [...new Set((css.match(/\.ti-[a-z0-9-]+:before/g) || [])
    .map(s => s.slice(1).replace(':before', '')))].sort();
  if(names.length < 1000) throw new Error('that does not look like the icon stylesheet');
  fs.writeFileSync(NAMES, names.join('\n') + '\n');
  console.log('refreshed: ' + names.length + ' icon names');
}

function run(){
  const known = new Set(fs.readFileSync(NAMES, 'utf8').split('\n').filter(Boolean));
  let fails = 0;
  for(const file of TARGETS){
    if(!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    const lines = src.split('\n');
    const bad = new Map();
    lines.forEach((line, i) => {
      // Only where it is actually asked to render: a class list containing
      // `ti`, or a bare 'ti-…' string literal, which is always a name on its
      // way into one. The second form is what let `ti-flame-filled` survive a
      // first pass of this check — it was the middle of a ternary, not an
      // `icon:` field. Prose cannot match: the quotes have to hug the name.
      const uses = [
        ...(line.match(/class=["'][^"']*\bti\b[^"']*["']/g) || []),
        ...(line.match(/'ti-[a-z0-9-]+'/g) || []),
      ].join(' ');
      (uses.match(/\bti-[a-z0-9-]+/g) || []).forEach(n => {
        if(known.has(n)) return;
        if(!bad.has(n)) bad.set(n, []);
        bad.get(n).push(i + 1);
      });
    });
    if(bad.size){
      console.log('\n' + file);
      for(const [n, at] of bad){
        console.log('  ✗ ' + n + '  — not in the font  (line' + (at.length>1?'s':'') + ' ' + at.join(', ') + ')');
        fails++;
      }
    } else {
      console.log('  ✓ ' + file + ': every icon resolves');
    }
  }
  console.log('\n' + (fails ? fails + ' icon' + (fails===1?'':'s') + ' would render as nothing' : 'ICON CHECK PASSED'));
  process.exit(fails ? 1 : 0);
}

if(process.argv.includes('--refresh')) refresh().then(run).catch(e => { console.error(e.message); process.exit(1); });
else run();
