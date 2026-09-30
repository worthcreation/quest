// node tools/audit.js [--save]: the codebase's report card (build 174). Run it at the start of a cleanup chat and at
// every handoff, not every build. Compares against docs/audit-baseline.json; --save writes the new numbers there (do
// that at a handoff, and copy the summary line into HANDOFF.md). It informs, it doesn't block: only tools/dead.js
// stops a ship. Sections:
//   unused     top-level names nothing references (tools/dead.js), want 0
//   size       lines per file and in total, lines over 200 characters, distinct state.* fields (shared-state coupling)
//   functions  the longest top-level functions; over 150 lines is flagged: split it when you're next in there
//   repeats    the same statement shape written 5 or more times: a helper (or a table entry) waiting to happen
//              (a lone ctx.fillRect and the like is pixel art and meant to repeat, so it isn't counted)
//   frames     JS cost of one update and one full draw per screen in the harness (fake canvas); over 2 ms is flagged,
//              and a screen that throws is listed as an error
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), SRC = path.join(root, 'src'), BASE = path.join(root, 'docs', 'audit-baseline.json');
const LIMIT = { fn: 150, repeat: 5, frameMs: 2, longLine: 200 };
const files = fs.readFileSync(path.join(SRC, 'ORDER'), 'utf8').split(/\s+/).filter(Boolean).map(f => f + '.js')   // the load order build.sh uses
  .filter(f => fs.existsSync(path.join(SRC, f)));
const body = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(SRC, f), 'utf8')]));
const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : null;
const delta = (now, was) => was == null || now === was ? '' : ` (${now > was ? '+' : ''}${+(now - was).toFixed(2)})`;
const out = [], say = s => out.push(s), now = {};

// unused
const unused = require('./dead.js').unused();
now.unused = unused.length;
say(`UNUSED  ${unused.length}${delta(unused.length, base && base.unused)}  (want 0)`);
unused.forEach(u => say(`  ${u.name}  ${u.where}`));

// size
const lines = Object.fromEntries(files.map(f => [f, body[f].split('\n').length]));
const all = Object.values(body).join('\n');
now.lines = Object.values(lines).reduce((a, b) => a + b, 0);
now.longLines = all.split('\n').filter(l => l.length > LIMIT.longLine).length;
now.stateFields = new Set(all.match(/\bstate\.[A-Za-z_$][\w$]*/g)).size;
now.files = lines;
say(`\nSIZE  ${now.lines} lines in ${files.length} files${delta(now.lines, base && base.lines)}; ` +
  `${now.longLines} over ${LIMIT.longLine} chars${delta(now.longLines, base && base.longLines)}; ` +
  `${now.stateFields} state fields${delta(now.stateFields, base && base.stateFields)}`);
const grew = files.map(f => [f, lines[f] - ((base && base.files && base.files[f]) || lines[f])]).filter(([, d]) => d);
say('  biggest: ' + files.slice().sort((a, b) => lines[b] - lines[a]).slice(0, 6).map(f => `${f} ${lines[f]}`).join(', '));
if (grew.length) say('  changed since baseline: ' + grew.map(([f, d]) => `${f} ${d > 0 ? '+' : ''}${d}`).join(', '));

// functions
const fns = [];
for (const f of files) {
  let open = null;
  body[f].split('\n').forEach((l, i) => {
    const m = /^(?:async\s+)?function\s+([\w$]+)/.exec(l);
    if (m && !/\}\s*(\/\/.*)?$/.test(l)) open = { name: m[1], file: f, at: i + 1 };
    else if (open && /^\}/.test(l)) { fns.push({ ...open, n: i + 2 - open.at }); open = null; }
  });
}
fns.sort((a, b) => b.n - a.n);
now.bigFns = fns.filter(x => x.n > LIMIT.fn).length;
say(`\nFUNCTIONS  ${fns.length} top-level; ${now.bigFns} over ${LIMIT.fn} lines${delta(now.bigFns, base && base.bigFns)}`);
fns.slice(0, 10).forEach(x => say(`  ${x.n > LIMIT.fn ? '!' : ' '} ${String(x.n).padStart(4)}  ${x.name}  ${x.file}:${x.at}`));

// repeats: statements with strings, numbers and spacing ignored; long enough to be worth a helper
const shapes = {};
for (const f of files) for (const raw of body[f].replace(/\/\/[^\n]*/g, '').split(/;|\n/)) {
  const s = raw.replace(/'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"/g, 'S').replace(/\b\d+(\.\d+)?\b/g, '#').replace(/\s+/g, ' ').trim();
  if (s.length < 45 || !s.includes('(') || /^ctx\.\w+\(/.test(s) ||   // lone canvas calls are drawing, meant to repeat
      /^(case|if|else|for|return|const|let|\}|\{)\b/.test(s) && s.length < 60) continue;
  const args = /^[\w.]+\((.*)\)$/.exec(s);                                // one call with nothing but literals in it (heroNote(S, #, { key: S }))
  if (args && args[1].replace(/\b\w+:/g, '').replace(/[S#,\s{}\[\]]/g, '') === '') continue;   // is data for a helper, not a helper waiting to happen
  (shapes[s] = shapes[s] || { n: 0, files: new Set() }).n++; shapes[s].files.add(f);
}
const reps = Object.entries(shapes).filter(([, v]) => v.n >= LIMIT.repeat).sort((a, b) => b[1].n - a[1].n);
now.repeats = reps.length;
say(`\nREPEATS  ${reps.length} statement shapes written ${LIMIT.repeat}+ times${delta(reps.length, base && base.repeats)}`);
reps.slice(0, 10).forEach(([s, v]) => say(`  ${String(v.n).padStart(3)}x  ${s.slice(0, 96)}${s.length > 96 ? '...' : ''}  [${[...v.files].join(' ')}]`));

// frames
const frames = (function () {
  const src = require('../tests/harness.js').src, rows = [];
  let res;
  eval(src + `;
    begin(); for (let k = 0; k < 10; k++) update(1 / 60);
    const ids = Object.keys(WORLD), ms = t0 => Number(process.hrtime.bigint() - t0) / 1e6;
    for (const id of ids) {
      try {
        enterScene(id); state.cut = null; state.intro = null; state.hero.hp = 99;
        for (let k = 0; k < 10; k++) update(1 / 60);
        let t0 = process.hrtime.bigint(); for (let k = 0; k < 90; k++) update(1 / 60); const u = ms(t0) / 90;
        t0 = process.hrtime.bigint(); for (let k = 0; k < 90; k++) draw(); const d = ms(t0) / 90;
        rows.push({ id, u, d });
      } catch (e) { rows.push({ id, err: String(e.message).slice(0, 80) }); }
    }
    res = rows;`);
  return res;
})();
const ok = frames.filter(r => !r.err), errs = frames.filter(r => r.err);
const slow = ok.filter(r => r.u + r.d > LIMIT.frameMs).sort((a, b) => (b.u + b.d) - (a.u + a.d));
const avg = ok.reduce((a, r) => a + r.u + r.d, 0) / (ok.length || 1);
now.frameAvg = +avg.toFixed(2); now.slowScreens = slow.length; now.frameErrors = errs.length;
say(`\nFRAMES  ${ok.length} screens, average ${avg.toFixed(2)} ms update+draw${delta(now.frameAvg, base && base.frameAvg)}; ` +
  `${slow.length} over ${LIMIT.frameMs} ms; ${errs.length} errors`);
ok.slice().sort((a, b) => (b.u + b.d) - (a.u + a.d)).slice(0, 6)
  .forEach(r => say(`  ${(r.u + r.d) > LIMIT.frameMs ? '!' : ' '} ${r.id.padEnd(12)} update ${r.u.toFixed(2)} ms, draw ${r.d.toFixed(2)} ms`));
errs.forEach(r => say(`  ERROR ${r.id}: ${r.err}`));

// summary (the line HANDOFF.md keeps)
const sum = `audit: ${now.lines} lines, ${now.unused} unused, ${now.bigFns} functions over ${LIMIT.fn}, ${now.repeats} repeats, ` +
  `${now.stateFields} state fields, frames avg ${now.frameAvg} ms (${now.slowScreens} slow, ${now.frameErrors} errors)`;
say('\n' + sum + (base ? `  [vs baseline of ${base.date}]` : '  [no baseline yet: run with --save]'));
console.log(out.join('\n'));
if (process.argv.includes('--save')) {
  now.date = new Date().toISOString().slice(0, 10);
  const m = /const BUILD = 'build (\d+)'/.exec(body['draw.js'] || ''); if (m) now.build = +m[1];
  fs.writeFileSync(BASE, JSON.stringify(now, null, 1) + '\n');
  console.log('saved docs/audit-baseline.json');
}
