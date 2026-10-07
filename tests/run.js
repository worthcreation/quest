// runs every test in this folder against ../index.html and prints one line each: name, its final "errs" count
// (and the last line it printed). Exit code 1 if any test errored or crashed. Usage: node tests/run.js [name ...]
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const dir = __dirname, pick = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'run.js' && f !== 'harness.js' && (!pick.length || pick.some(p => f.startsWith(p)))).sort();
let bad = 0; const t0 = Date.now(), times = [];
for (const f of files) {
  let out = '', ok = true; const t1 = Date.now();
  try { out = execFileSync('node', [path.join(dir, f)], { cwd: os.tmpdir(), encoding: 'utf8', timeout: 240000, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { ok = false; out = (e.stdout || '') + (e.stderr || ''); }
  const lines = out.trim().split('\n'), errs = (out.match(/errs (\d+)/g) || []).pop() || '(no errs line)';
  const fail = !ok || /errs [1-9]|Error/.test(errs) || /^\s*at |Error/.test(lines[lines.length - 1] || '');
  if (fail) bad++;
  const sec = (Date.now() - t1) / 1000; times.push([sec, f]);
  console.log(`${fail ? 'FAIL' : ' ok '}  ${f.replace('.js', '').padEnd(22)} ${sec.toFixed(1).padStart(5)}s  ${errs}${fail ? '\n      ' + lines.slice(-3).join('\n      ') : ''}`);
}
times.sort((a, b) => b[0] - a[0]);
console.log(`\n${files.length - bad} of ${files.length} passed in ${((Date.now() - t0) / 1000).toFixed(0)} s; slowest: ` + times.slice(0, 8).map(([s, f]) => f.replace('.js', '') + ' ' + s.toFixed(0)).join(', '));
process.exit(bad ? 1 : 0);
