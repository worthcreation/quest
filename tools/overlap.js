// generate many worlds and check that no two interactables share ground
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const noop = () => {}; const grad = { addColorStop: noop };
const mkctx = () => new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'measureText' ? s => ({ width: s.length * 8 }) : k.startsWith('create') ? () => grad : noop), set: (t, k, v) => (t[k] = v, true) });
const el = () => ({ appendChild: noop, click: noop, addEventListener: noop, getContext: mkctx, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: el, documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
eval(src + `;
const U = 1280 / 14 * (800 / 1280);   // UNIT at the generation size (800/14)
let bad = 0, worlds = 300;
for (let n = 0; n < worlds; n++) {
  const Wd = buildWorld(1000 + n * 7919);
  for (const [id, sc] of Object.entries(Wd)) {
    const things = [];
    const add = (kind, fx, fy, r) => things.push({ kind, x: fx * 1280, y: fy * 800, r: r * U });
    if (sc.feat.shroom) add('mushroom', ...sc.feat.shroom, 1.0);
    for (const p of sc.feat.plots || []) add('plot', ...p, 0.5);
    for (const p of sc.pullables) add(p.kind, p.fx, p.fy, 0.8);
    for (const c of sc.npcs) add(c.kind, c.fx, c.fy, 0.9);
    for (const it of sc.initItems) add(it.type, it.fx, it.fy, 0.4);
    if (sc.feat.stone) add('sinkhole', ...sc.feat.stone, 0.9);
    for (let i = 0; i < things.length; i++) for (let j = i + 1; j < things.length; j++) {
      const a = things[i], b = things[j];
      const shrineGroup = id === 'sw3' && a.kind !== 'plot' && b.kind !== 'plot' && a.kind !== 'mushroom' && b.kind !== 'mushroom';
      if (shrineGroup || (a.kind === 'plot' && b.kind === 'plot')) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) { bad++; if (bad < 12) console.log('overlap', 'world', n, id, a.kind, b.kind, Math.round(Math.hypot(a.x - b.x, a.y - b.y))); }
    }
    for (const p of sc.feat.plots || []) for (const o of sc.pools) if (Math.hypot((p[0] - o.fx) * 1280, (p[1] - o.fy) * 800) < (o.r + 0.5) * U) { bad++; console.log('plot in pool', n, id); }
  }
}
console.log('worlds', worlds, 'overlaps', bad);
`);
