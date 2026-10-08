// How much text does a student actually have to read before the "Why?" fold,
// and at roughly what grade level. Flesch-Kincaid is crude but it is consistent,
// and the target audience is Grade 9 including students with learning needs.
const fs = require('fs');
const src = fs.readFileSync('/home/user/aa-dash/portal-lab.html', 'utf8');

const block = src.slice(src.indexOf('const CARD_ATTRS = ['), src.indexOf('// Thresholds are rungs'));
const sup   = src.slice(src.indexOf('const CARD_SUPPORT = {'), src.indexOf('// Thresholds are rungs'));

const field = (txt, id, key) => {
  const seg = txt.slice(txt.indexOf("id:'" + id + "'"));
  const m = seg.match(new RegExp(key + ":'((?:[^'\\\\]|\\\\.)*)'"));
  return m ? m[1].replace(/\\'/g, "'") : '';
};
const moveOf = id => {
  const m = sup.match(new RegExp(id + ":\\{[^}]*move:'((?:[^'\\\\]|\\\\.)*)'"));
  return m ? m[1].replace(/\\'/g, "'") : '';
};

const syll = w => {
  w = w.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  return (w.match(/[aeiouy]{1,2}/g) || ['x']).length;
};
const fk = t => {
  const words = (t.match(/[A-Za-z’'-]+/g) || []);
  const sents = Math.max(1, (t.match(/[.!?]+/g) || []).length);
  if (!words.length) return 0;
  const sy = words.reduce((a, w) => a + syll(w), 0);
  return 0.39 * (words.length / sents) + 11.8 * (sy / words.length) - 15.59;
};
const words = t => (t.match(/[A-Za-z’'-]+/g) || []).length;

const IDS = ['strength','power','speed','agility','engine','movement','mobility','consistency','knowledge','mindset'];
let fails = 0, totalVisible = 0, totalWhy = 0;

console.log('attribute      visible  grade   why   | the visible text');
console.log('-'.repeat(100));
for (const id of IDS) {
  const what = field(block, id, 'what');
  const pace = field(block, id, 'pace');
  const why  = field(block, id, 'why');
  const move = moveOf(id);
  const visible = [what, move, pace].join(' ');
  const vw = words(visible), g = fk(visible);
  totalVisible += vw; totalWhy += words(why);
  console.log(
    id.padEnd(14) + String(vw).padStart(4) + 'w' +
    ('  ' + g.toFixed(1)).padStart(8) +
    ('  ' + (words(why) ? words(why) + 'w' : '—')).padStart(7) +
    '  | ' + visible.slice(0, 58));
  if (vw > 45) { console.log('      ^ FAIL: ' + vw + ' words before the fold (limit 45)'); fails++; }
  if (g > 9.5) { console.log('      ^ FAIL: grade ' + g.toFixed(1) + ' (limit 9.5)'); fails++; }
  const longSentence = visible.split(/[.!?]+/).map(s => words(s)).some(n => n > 20);
  if (longSentence) { console.log('      ^ FAIL: a sentence over 20 words'); fails++; }
  // Only `pace` says how long before it moves. `move` may state a FREQUENCY —
  // "two or three times a week" is exactly what belongs there — but not a
  // duration, because that is the same answer twice and the two drifted apart:
  // strength said "six to eight weeks" on one line and "months, not weeks" two
  // lines below it. A count followed by a plural unit is a duration; "a week"
  // and "most days" are rates.
  const DURATION = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:to\s+\w+\s+)?(weeks|months|years)\b|\bbefore you judge\b/i;
  if (DURATION.test(move)) {
    console.log('      ^ FAIL: "what moves it" states a duration — that is what "how long it takes" is for');
    fails++;
  }
}
console.log('-'.repeat(100));
console.log('visible across all ten: ' + totalVisible + ' words · folded behind "Why?": ' + totalWhy + ' words');
console.log('\n' + (fails ? fails + ' FAILED' : 'all within the reading budget'));
process.exit(fails ? 1 : 0);
