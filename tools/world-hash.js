// hash the generated world for a spread of seeds: the proof that a change to world.js changed nothing in play.
// node tools/world-hash.js            prints one line per seed and a total; compare before and after.
// node tools/world-hash.js --total    prints the total only.
// Functions (locked exits and the like) hash by their source, so a reworded closure shows up too.
const fs = require('fs');
const crypto = require('crypto');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const noop = () => {}; const grad = { addColorStop: noop };
const mkctx = () => new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'measureText' ? s => ({ width: s.length * 8 }) : k.startsWith('create') ? () => grad : noop), set: (t, k, v) => (t[k] = v, true) });
const el = () => ({ appendChild: noop, click: noop, addEventListener: noop, getContext: mkctx, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: el, documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
const totalOnly = process.argv.includes('--total');
eval(src + `;
const seeds = [1, 2, 3, 7, 42, 100, 999, 1000003, 2027, 20260930, 7919, 1234567, 9999991];
for (let n = 0; n < 40; n++) seeds.push(1000 + n * 7919);      // the same seeds the overlap check walks
const total = crypto.createHash('sha256');
for (const seed of seeds) {
  const text = JSON.stringify(buildWorld(seed), (k, v) => typeof v === 'function' ? 'fn:' + v.toString() : v);
  const h = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  total.update(h);
  if (!totalOnly) console.log('seed', seed, h, text.length);
}
console.log('seeds', seeds.length, 'world hash', total.digest('hex').slice(0, 24));
`);
