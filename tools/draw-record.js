// node tools/draw-record.js [out.json]: records every canvas call (method, rounded args, property sets) that drawSolid
// makes for each solid kind and drawItemIcon for each item type, with fixed time, seed and random. Run it before and
// after a drawing refactor and diff the two files (or compare the printed hashes): matching output means the picture
// is the same call for call. Kinds come from the tables (SOLID_DRAW, ICONS) plus RAW and a few unknown names, each
// drawn plain and with every optional flag set, and with the fire lit and out.
const fs = require('fs'), crypto = require('crypto');
const { src } = require('../tests/harness.js');
const calls = [], round = v => typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : typeof v === 'string' ? v : v && v.grad ? '<grad>' : String(v);
const grad = () => { const g = { grad: true, addColorStop: (o, c) => calls.push(['stop', round(o), c]) }; return g; };
const rec = new Proxy({}, {
  get: (t, k) => { if (k === 'measureText') return s => ({ width: s.length * 8 }); if (k in t) return t[k];
    return (...a) => { calls.push([k, ...a.map(round)]); return k.startsWith('create') ? grad() : undefined; }; },
  set: (t, k, v) => { t[k] = v; calls.push(['=' + k, round(v)]); return true; },
});
global.document.getElementById = () => ({ addEventListener() {}, getContext: () => rec, remove() {}, style: {}, classList: { toggle() {} }, dataset: {} });
Math.random = () => 0.5;
eval(src + `;
state.started = true; state.intro = null; enterScene('w1'); state.cut = null; state.time = 1.5;
state.stalCool.k = 99; rtFor(state.scene).flags.hits_b1 = 2; state.inv.shrooms[sceneDef().id] = true; state.inv.up.edge = 2;
const out = {}, take = (name, f) => { calls.length = 0; state.fx = []; f(); out[name] = { n: calls.length, fx: state.fx.length, hash: crypto.createHash('md5').update(JSON.stringify(calls)).digest('hex') }; };
const kinds = [...Object.keys(SOLID_DRAW), 'wall', 'tree', 'nothing'];
const hm = (who, i) => ({ ...HAMMOCKS[i], ...hammockShape(HAMMOCKS[i]), rock: 0.3, rockV: 0 });
const full = { pal: 'moss', craggy: true, flip: true, gap: true, holeMid: true, rope: [0.5, 0.5], stone: 'geode', bar: 'b1', hp: 3, size: 2, key: 'k', dark: true, tint: '#8a7060' };
for (const kind of kinds) for (const [tag, extra] of [['', {}], ['+', full]]) for (const lit of [0, 1]) {
  state.fireLit = lit;
  take(kind + tag + lit, () => drawSolid({ kind, x: 300.5, y: 200.25, vis: 37, r: 33, fx: 0.31, fy: 0.62, hm: kind === 'hammock' ? hm('pip', tag ? 1 : 0) : undefined, ...extra }));
}
for (const [who, i] of [['pip', 0], ['hero', 1]]) { state.pipIn = who === 'pip'; state.hammock = who === 'hero' ? { t: 2 } : null; take('hammock:in:' + who, () => drawSolid({ kind: 'hammock', x: 0, y: 0, vis: 0, r: 0, hm: hm(who, i) })); }
state.pipIn = false; state.hammock = null;
const types = [...Object.keys(ICONS), ...Object.keys(RAW), 'mat', 'nothing'];
for (const type of types) take('icon:' + type, () => drawItemIcon(type, 100.5, 80.25, 41));
const file = process.argv[2];
if (file) fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(Object.keys(out).length + ' recordings, ' + Object.values(out).reduce((a, r) => a + r.n, 0) + ' canvas calls, total ' + crypto.createHash('md5').update(JSON.stringify(out)).digest('hex') + (file ? ' -> ' + file : ''));
`);
