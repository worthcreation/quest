// runs every test in this folder against ../index.html and prints one line each: name, its final "errs" count
// (and the last line it printed). Exit code 1 if any test errored or crashed. Usage: node tests/run.js [name ...]
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const dir = __dirname, pick = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'run.js' && (!pick.length || pick.some(p => f.startsWith(p)))).sort();
let bad = 0;
for (const f of files) {
  let out = '', ok = true;
  try { out = execFileSync('node', [path.join(dir, f)], { cwd: '/tmp', encoding: 'utf8', timeout: 240000, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { ok = false; out = (e.stdout || '') + (e.stderr || ''); }
  const lines = out.trim().split('\n'), errs = (out.match(/errs (\d+)/g) || []).pop() || '(no errs line)';
  const fail = !ok || /errs [1-9]|Error/.test(errs) || /^\s*at |Error/.test(lines[lines.length - 1] || '');
  if (fail) bad++;
  console.log(`${fail ? 'FAIL' : ' ok '}  ${f.replace('.js', '').padEnd(22)} ${errs}${fail ? '\n      ' + lines.slice(-3).join('\n      ') : ''}`);
}
console.log(`\n${files.length - bad} of ${files.length} passed`);
process.exit(bad ? 1 : 0);
