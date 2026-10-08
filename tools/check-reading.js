#!/usr/bin/env node
/**
 * Reading-load guard and audit for the student portals.
 *
 *     node tools/check-reading.js              # guard: fail on anything over budget
 *     node tools/check-reading.js --audit      # survey: every long string, worst first
 *     node tools/check-reading.js --audit 30   # top 30 only
 *
 * Why this exists: the Training Age panels drifted into 635 words of
 * adult-register prose before anyone noticed, including a paragraph about 43
 * studies aimed at a fourteen-year-old on a phone. The copy is spread across a
 * 14,000-line single file, so nobody was ever going to spot that by reading.
 *
 * Two jobs:
 *   1. GUARD — the Training Age attribute copy has a fixed budget. Over it, fail.
 *   2. AUDIT — find every other user-facing string that reads like an essay,
 *      with the line number and the function it lives in, worst first.
 *
 * The grade figure is Flesch-Kincaid. It is crude, and it is not the point on
 * its own — a short sentence full of coaching jargon scores well and still
 * means nothing to a student. Use it with the word count and read the line.
 */
const fs = require('fs');
const FILE = process.argv.includes('--file')
  ? process.argv[process.argv.indexOf('--file') + 1]
  : 'portal-lab.html';
const src = fs.readFileSync(FILE, 'utf8');

// ---- shared measures -------------------------------------------------------
const syll = w => {
  w = w.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  return (w.match(/[aeiouy]{1,2}/g) || ['x']).length;
};
const words = t => (t.match(/[A-Za-z’'-]+/g) || []).length;
const fk = t => {
  const w = (t.match(/[A-Za-z’'-]+/g) || []);
  const s = Math.max(1, (t.match(/[.!?]+/g) || []).length);
  if (!w.length) return 0;
  return 0.39 * (w.length / s) + 11.8 * (w.reduce((a, x) => a + syll(x), 0) / w.length) - 15.59;
};
const longestSentence = t => Math.max(0, ...t.split(/[.!?]+/).map(words));

// ---------------------------------------------------------------------------
// 1. GUARD — the Training Age attribute copy
// ---------------------------------------------------------------------------
let fails = 0;
const fail = m => { console.log('      ^ FAIL: ' + m); fails++; };

const block = src.slice(src.indexOf('const CARD_ATTRS = ['), src.indexOf('// Thresholds are rungs'));
const field = (id, key) => {
  const seg = block.slice(block.indexOf("id:'" + id + "'"));
  const m = seg.match(new RegExp(key + ":'((?:[^'\\\\]|\\\\.)*)'"));
  return m ? m[1].replace(/\\'/g, "'") : '';
};
const moveOf = id => {
  const m = block.match(new RegExp(id + ":\\{[^}]*move:'((?:[^'\\\\]|\\\\.)*)'"));
  return m ? m[1].replace(/\\'/g, "'") : '';
};

const IDS = ['strength','power','speed','agility','engine','movement','mobility','consistency','knowledge','mindset'];
let totalVisible = 0, totalWhy = 0;
console.log('TRAINING AGE — what a student reads before the "Why?" fold\n');
console.log('attribute      visible  grade   why   | the visible text');
console.log('-'.repeat(100));
for (const id of IDS) {
  const why = field(id, 'why'), move = moveOf(id);
  const visible = [field(id, 'what'), move, field(id, 'pace')].join(' ');
  const vw = words(visible), g = fk(visible);
  totalVisible += vw; totalWhy += words(why);
  console.log(id.padEnd(14) + String(vw).padStart(4) + 'w' +
    ('  ' + g.toFixed(1)).padStart(8) +
    ('  ' + (words(why) ? words(why) + 'w' : '—')).padStart(7) +
    '  | ' + visible.slice(0, 58));
  if (vw > 45) fail(vw + ' words before the fold (limit 45)');
  if (g > 9.5) fail('grade ' + g.toFixed(1) + ' (limit 9.5)');
  if (longestSentence(visible) > 20) fail('a sentence over 20 words');
  // Only `pace` says how long before it moves. `move` may state a FREQUENCY —
  // "two or three times a week" is exactly what belongs there — but not a
  // duration, because that is the same answer twice and the two drifted apart:
  // strength said "six to eight weeks" on one line and "months, not weeks" two
  // lines below it.
  if (/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:to\s+\w+\s+)?(weeks|months|years)\b|\bbefore you judge\b/i.test(move))
    fail('"what moves it" states a duration — that is what "how long it takes" is for');
}
console.log('-'.repeat(100));
console.log('visible across all ten: ' + totalVisible + ' words · folded behind "Why?": ' + totalWhy + ' words');

// ---------------------------------------------------------------------------
// 2. AUDIT — every other long string a student can see
// ---------------------------------------------------------------------------
if (process.argv.includes('--audit')) {
  const nArg = parseInt(process.argv[process.argv.indexOf('--audit') + 1], 10);
  const LIMIT = isFinite(nArg) ? nArg : 40;

  const lines = src.split('\n');
  // Which function a line sits in, so a finding can actually be found.
  const owner = i => {
    for (let j = i; j >= 0; j--) {
      const m = lines[j].match(/^\s*(?:async\s+)?function\s+([A-Za-z0-9_$]+)/);
      if (m) return m[1];
    }
    return '(top level)';
  };

  const found = [];
  const seen = new Set();
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;   // comments are for us
    // Quoted prose, and plain text sitting between HTML tags.
    const cands = [
      ...(line.match(/'((?:[^'\\]|\\.){40,})'/g) || []).map(s => s.slice(1, -1)),
      ...(line.match(/>([^<>{}]{40,})</g) || []).map(s => s.slice(1, -1)),
    ];
    for (let c of cands) {
      c = c.replace(/\\'/g, "'").replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (/^[\s\W]*$/.test(c)) continue;
      if (/^(https?:|[A-Za-z-]+:[^ ]|\.[a-z-]+ ?\{|[a-z-]+:[^ ]+;)/.test(c)) continue;  // urls, css
      if (!/[a-z]{3}/.test(c)) continue;
      // Code that happens to contain prose: template concatenation, object
      // literals, and attributes the student never reads.
      if (/'\s*\+|\+\s*'|\{|\}|aria-label|title=|^·/.test(c)) continue;
      // Not read by a student: rubric: is the AI marking criteria, explicitly
      // never shown; why: on a card attribute is already folded behind "Why?".
      if (/\b(rubric|why):\s*'/.test(line) && !/\bexplain:/.test(line)) continue;
      const w = words(c);
      if (w < 14) continue;                       // a label is not an essay
      if (seen.has(c)) continue; seen.add(c);
      found.push({ line: i + 1, fn: owner(i), w, g: fk(c), ls: longestSentence(c), t: c });
    }
  });

  // Worst first: long, dense, and with at least one unbroken run of words.
  found.sort((a, b) => (b.w + b.ls * 2 + Math.max(0, b.g) * 3) - (a.w + a.ls * 2 + Math.max(0, a.g) * 3));

  console.log('\n\nAUDIT — user-facing strings of 14+ words in ' + FILE +
              '\n' + found.length + ' found, worst ' + Math.min(LIMIT, found.length) + ' shown' +
              ' (score = words + longest sentence + grade)\n');
  console.log('line   words  grade  longest  where');
  console.log('-'.repeat(100));
  found.slice(0, LIMIT).forEach(f => {
    console.log(String(f.line).padStart(5) + String(f.w).padStart(7) +
      f.g.toFixed(1).padStart(7) + String(f.ls).padStart(9) + '  ' + f.fn);
    console.log('        ' + f.t.slice(0, 92) + (f.t.length > 92 ? '…' : ''));
  });

  // Where the weight sits, so the sweep has an order.
  const byFn = {};
  found.forEach(f => { byFn[f.fn] = (byFn[f.fn] || 0) + f.w; });
  const top = Object.entries(byFn).sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log('\nWEIGHT BY FUNCTION — where the reading actually is');
  console.log('-'.repeat(60));
  top.forEach(([fn, w]) => console.log('  ' + String(w).padStart(5) + 'w  ' + fn));
  console.log('\n  ' + found.reduce((a, f) => a + f.w, 0) + ' words total in strings of 14+ words');
}

console.log('\n' + (fails ? fails + ' FAILED' : 'all within the reading budget'));
process.exit(fails ? 1 : 0);
