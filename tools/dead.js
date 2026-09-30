// node tools/dead.js: top-level functions, consts and lets in src/ that nothing else names (src, tests, tools,
// head.html). Each line: name, file:line. Want an empty list; anything printed is a candidate for deleting in the
// same build (WAYS principle 10), unless it's a hook the game will wire up soon (say so in a comment by it).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = d => fs.readdirSync(d).filter(f => /\.(js|html|sh)$/.test(f)).map(f => [path.join(d, f), fs.readFileSync(path.join(d, f), 'utf8')]);
const src = read(path.join(root, 'src')), all = [...src, ...read(path.join(root, 'tests')), ...read(path.join(root, 'tools'))];
const defs = [];
for (const [file, text] of src) text.split('\n').forEach((line, i) => {
  const m = /^(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(line);
  if (m) defs.push([m[1], path.relative(root, file) + ':' + (i + 1)]);
});
const text = all.map(([, t]) => t).join('\n');
const out = [];
for (const [name, where] of defs) {
  const n = (text.match(new RegExp('(?<![\\w$])' + name.replace(/\$/g, '\\$') + '(?![\\w$])', 'g')) || []).length;
  if (n <= 1) out.push(name + '  ' + where);
}
console.log(out.length ? out.join('\n') : 'nothing unused');
console.log('unused', out.length);
