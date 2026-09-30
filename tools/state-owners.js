// state-owners.js: who touches each state.* field. Prints one line per field: where it's declared, then per src file
// the count of writes (state.x = ..., +=, ++, delete, push/splice/pop on it), mutations (state.x.y = ..., state.x[k] = ...)
// and reads. Tests and tools are listed after, as a hint, not as owners. docs/state-owners.md is written by hand from
// this output plus reading the code; rerun after moving a field to check the map still holds.
//   node tools/state-owners.js            table, one line per field
//   node tools/state-owners.js --json     the same as JSON
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ORDER = fs.readFileSync(path.join(ROOT, 'src/ORDER'), 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const srcFiles = ORDER.map(n => ['src', n + '.js']);
const others = ['tests', 'tools'].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.js') && f !== 'state-owners.js').map(f => [d, f]));

const RE = /\bstate\.([A-Za-z_$][\w$]*)/g;
const fields = {};   // name -> { declared, files: { file: { w, m, r } } }
const touch = (name, file, kind) => {
  const f = fields[name] || (fields[name] = { declared: null, files: {} });
  const c = f.files[file] || (f.files[file] = { w: 0, m: 0, r: 0 });
  c[kind]++;
};
function classify(src, i, end) {
  // i: index just after the field name
  const before = src.slice(Math.max(0, i - 12), i);
  if (/\bdelete\s+state\.[\w$]*$/.test(before)) return 'w';
  let rest = src.slice(i, i + 80);
  if (/^\s*(\+\+|--)/.test(rest) || /(\+\+|--)\s*$/.test(before.replace(/state\.[\w$]*$/, ''))) return 'w';
  if (/^\s*([-+*\/%|&^]|<<|>>|\?\?|\|\||&&)?=(?!=)/.test(rest)) return 'w';
  if (/^\s*\.(push|pop|shift|unshift|splice|sort|reverse|fill|length\s*=)/.test(rest)) return 'w';
  // nested: state.x.y = 1, state.x[k] = 1, state.x.y.z = 1, state.x.push handled above; state.x.y++ etc.
  const m = rest.match(/^((\.[\w$]+|\[[^\]]*\])+)/);
  if (m) {
    const after = rest.slice(m[0].length);
    if (/^\s*([-+*\/%|&^]|<<|>>|\?\?|\|\||&&)?=(?!=)/.test(after) || /^\s*(\+\+|--)/.test(after)) return 'm';
    if (/^\s*\.(push|pop|shift|unshift|splice|sort|reverse|fill)\s*\(/.test(after)) return 'm';
    if (/\bdelete\s+$/.test(before)) return 'm';
  }
  return 'r';
}
for (const [dir, name] of [...srcFiles, ...others]) {
  const p = path.join(ROOT, dir, name);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  const file = dir === 'src' ? name.replace(/\.js$/, '') : dir + '/' + name.replace(/\.js$/, '');
  let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(src))) touch(m[1], file, classify(src, m.index + m[0].length));
}
// declaration: the state = { ... } literal in world.js, and any state.x = in a function that first sets it
const world = fs.readFileSync(path.join(ROOT, 'src/world.js'), 'utf8');
const lit = world.slice(world.indexOf('\nstate = {'), world.indexOf('\n};', world.indexOf('\nstate = {')));
for (const k of Object.keys(fields)) fields[k].declared = new RegExp(`(^|[\\s,{])${k.replace(/\$/g, '\\$')}\\s*:`).test(lit) ? 'literal' : 'ad hoc';

const names = Object.keys(fields).sort();
if (process.argv.includes('--json')) { console.log(JSON.stringify(fields, null, 1)); process.exit(0); }
const fmt = c => [c.w ? `w${c.w}` : '', c.m ? `m${c.m}` : '', c.r ? `r${c.r}` : ''].filter(Boolean).join('');
for (const n of names) {
  const f = fields[n];
  const src = Object.entries(f.files).filter(([k]) => !k.includes('/')).sort((a, b) => (b[1].w + b[1].m) - (a[1].w + a[1].m) || b[1].r - a[1].r);
  const oth = Object.entries(f.files).filter(([k]) => k.includes('/'));
  console.log(`${n.padEnd(12)} ${f.declared.padEnd(8)} ${src.map(([k, c]) => `${k}:${fmt(c)}`).join(' ')}${oth.length ? '   | ' + oth.map(([k, c]) => `${k}:${fmt(c)}`).join(' ') : ''}`);
}
console.log(`\n${names.length} fields (src only: ${names.filter(n => Object.keys(fields[n].files).some(k => !k.includes('/'))).length})`);
