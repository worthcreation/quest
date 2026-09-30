// node tools/dead.js: top-level functions, consts and lets in src/ that nothing else names (src, tests, tools).
// A hook kept on purpose carries "keep:" in a comment on its definition line and isn't listed. Exits 1 when anything
// is listed, so tools/ship-local.js stops: delete it in the same build (WAYS principle 10) or mark it keep: with a reason.
// tools/audit.js reuses unused() for its report.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = d => fs.readdirSync(d).filter(f => /\.(js|html|sh)$/.test(f)).map(f => [path.join(d, f), fs.readFileSync(path.join(d, f), 'utf8')]);
function unused() {
  const src = read(path.join(root, 'src')), all = [...src, ...read(path.join(root, 'tests')), ...read(path.join(root, 'tools'))];
  const text = all.map(([, t]) => t).join('\n'), out = [];
  for (const [file, body] of src) body.split('\n').forEach((line, i) => {
    const m = /^(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(line);
    if (!m || /\/\/.*\bkeep:/.test(line)) return;
    const n = (text.match(new RegExp('(?<![\\w$])' + m[1].replace(/\$/g, '\\$') + '(?![\\w$])', 'g')) || []).length;
    if (n <= 1) out.push({ name: m[1], where: path.relative(root, file) + ':' + (i + 1) });
  });
  return out;
}
module.exports = { unused };
if (require.main === module) {
  const out = unused();
  console.log(out.length ? out.map(o => o.name + '  ' + o.where).join('\n') : 'nothing unused');
  console.log('unused', out.length);
  process.exit(out.length ? 1 : 0);
}
