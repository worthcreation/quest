const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const src = fs.readFileSync('/mnt/user-data/outputs/index.html', 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const noop = () => {};
const game = createCanvas(800, 600);
const mk = () => createCanvas(10, 10);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {}, set textContent(v) {}, set innerHTML(v) {} });
global.document = {
  getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(),
  querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? mk() : stubEl(),
  documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop,
};
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
const seed = process.argv[2] || '424242';
global.location = { search: '?overview=' + seed };
eval(src);
fs.writeFileSync(`/mnt/user-data/outputs/quest-map-${seed}.png`, game.toBuffer('image/png'));
console.log('wrote', game.width, 'x', game.height);
