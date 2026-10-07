// A still, not game code (6 Oct, after 230, Ross: a script of beats and stills for the moments). Six moments of the
// mountain's mood arc, each the game's own frame with the proposed look painted over it (marked PAINT-OVER on the
// sheet): 1 the rise's looking-back ledge, the lean-to tiny below; 2 m1 awe, the stacked face at dawn, warm light
// from the east on the tops, cool in the lees, lichen in rust and sage; 3 m2 play, the horseshoe with rabbits at the
// carrots; 4 m3 hush, inside the stone, the window your lamp, a glowing mushroom, wet floor; 5 m4 struggle, bare
// ridges, grit streaming; 6 the hollow, relief: the wind gone, grass, a peach tree, the ornithologist's kettle.
// Run from the repo root after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`:
// node docs/parked/mock-beats.js   writes /mnt/user-data/outputs/quest-beats.png
const { createCanvas, Path2D } = require('@napi-rs/canvas'); global.Path2D = Path2D;
const fs = require('fs');
let src = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
global.location = { search: '' };
const st = (pts, r, thick, base = 0, under = -1, seed = 0) => ({ kind: 'brush', strokes: [{ r, pts }], plates: [], seed, base, thick, tone: 134, under });
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
const grab = () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c; };
const shots = [];
const pr = (x, y, z) => { const c = state.mtn; return mtnProj(x, y, mtnH(c.m, x, y) + z, c); };
const ring = (R, g = ctx) => { g.beginPath(); R.forEach(([X, Y], i) => i ? g.lineTo(X, Y) : g.moveTo(X, Y)); g.closePath(); };
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
// the proposed light: the tops warmed from the east (a wash heavier to the east of each top), the faces that look
// away from the sun cooled, lichen flakes in rust and sage on the sunlit tops only
function dawn(pl, strength = 1) {
  const warm = 'rgba(255,196,120,', cool = 'rgba(70,90,140,';
  for (const p of pl.list) { const top = plateTop(p), T = p.P.map(([x, y]) => pr(x, y, top)), F = p.P.map(([x, y]) => pr(x, y, p.base));
    const xs = T.map(q => q[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, warm + (0.06 * strength) + ')'); g.addColorStop(1, warm + (0.22 * strength) + ')');
    ctx.save(); ring(T); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(x0, -H, x1 - x0, H * 3);
    for (let k = 0; k < (x1 - x0) * (p.thick > 0.3 ? 0.08 : 0.04); k++) { const x = x0 + rnd() * (x1 - x0), y = Math.min(...T.map(q => q[1])) + rnd() * (Math.max(...T.map(q => q[1])) - Math.min(...T.map(q => q[1]))); if (!plateIn(T, x, y)) continue; ctx.fillStyle = rnd() < 0.5 ? 'rgba(190,110,60,.35)' : 'rgba(150,170,110,.35)'; ctx.beginPath(); ctx.ellipse(x, y, 3 + rnd() * 5, 2 + rnd() * 3, rnd() * 3, 0, 6.28); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < T.length; i++) { const j = (i + 1) % T.length, ex = T[j][0] - T[i][0], ey = T[j][1] - T[i][1], L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L, mx = (T[i][0] + T[j][0]) / 2, my = (T[i][1] + T[j][1]) / 2, fx = (F[i][0] + F[j][0]) / 2, fy = (F[i][1] + F[j][1]) / 2;
      if (!((fx - mx) * nx + (fy - my) * ny > 0.2 && fy > my + 0.2)) continue; const away = nx < 0 ? 0.3 : 0.08;   // a face looking west is in the lee of the dawn
      ctx.fillStyle = cool + (away * strength) + ')'; ctx.beginPath(); ctx.moveTo(T[i][0], T[i][1]); ctx.lineTo(T[j][0], T[j][1]); ctx.lineTo(F[j][0], F[j][1]); ctx.lineTo(F[i][0], F[i][1]); ctx.closePath(); ctx.fill(); } }
}
const sky = (a, b) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
function shot(id, layout, x, y, zoom, paint, label) {
  if (layout) { LAYOUTS.flat = layout; FLAT.pl = null; FLAT.land = null; FLAT.fixed.zoom = 0.825 * zoom; }
  state.started=true; state.intro=null; startTestScene(id, x / MTN[id].len, y / MTN[id].D); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[]; state.items=[];
  const h = state.hero; h.x = x*UNIT; h.y = y*UNIT; h.liftAt = null; h.z = 0; paint.before && paint.before(); for (let k=0;k<8;k++) { update(1/60); h.x = x*UNIT; h.y = y*UNIT; } state.texts=[]; state.title=null; state.scrolls=[]; draw();
  paint.after && paint.after(); shots.push([grab(), label]); }
// 1. the rise, the looking-back ledge: pulled back, the lean-to far below (a paint-over: it is on another screen)
shot('rise', null, 74, 13, 1, { after: () => { ctx.save(); const X = 150, Y = H - 90; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(X, Y + 14, 34, 10, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.moveTo(X - 26, Y + 10); ctx.lineTo(X, Y - 18); ctx.lineTo(X + 26, Y + 10); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5a4428'; ctx.fillRect(X - 3, Y - 2, 6, 12); ctx.strokeStyle = 'rgba(230,230,220,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 30, Y - 4); ctx.quadraticCurveTo(X + 40, Y - 30, X + 34, Y - 52); ctx.stroke(); ctx.fillStyle = 'rgba(255,230,160,.9)'; ctx.font = '18px monospace'; ctx.fillText('camp, far below', X + 44, Y + 4); ctx.restore(); } },
  '1  LEAVING HOME. The rise, partway up: the view pulls back and the lean-to shows at the foot of the screen. The first secret is looking back.  PAINT-OVER: the lean-to');
// 2. m1 awe: a face of stacked sheets, pulled far back, at dawn
const sheets = []; for (let i = 0; i < 7; i++) sheets.push(st([[6 + i * 2.2, 20 - i * 2.4], [34 - i * 1.5, 19 - i * 2.6]], 1.6 + (i % 2) * 0.4, 0.5 + (i % 3) * 0.1, +(i * 0.55).toFixed(2), i ? i - 1 : -1, 70 + i));
shot('flat', { plates: sheets, pits: [], seams: [{ spine: [[2, 22, 0.1], [18, 14, 0.09], [30, 8, 0.1]] }] }, 8, 21.5, 0.4, { after: () => { ctx.save(); ctx.globalCompositeOperation = 'multiply'; sky('rgba(255,225,190,1)', 'rgba(220,210,200,1)'); ctx.restore(); dawn(platesLay(FLAT), 1); } },
  '2  AWE. m1 the climb: the mountain\\'s face across the screen, sheets stacked, the path a thread. Dawn: warm from the east on the tops, cool in the lees, lichen in rust and sage.  PAINT-OVER: the light');
// 3. m2 play: the horseshoe, rabbits at the carrots
const LED = { plates: [st([[11.2, 9.2], [17, 12]], 1.0, 0.45, 0, -1, 12), st([[25.5, 10], [25.3, 8], [26, 6], [28, 5], [30, 6], [30.7, 8], [30.5, 10]], 0.8, 0.9, 0, -1, 21), st([[27, 3.1], [29, 3.1]], 0.6, 0.5, 0, -1, 22), st([[18.2, 13.2], [23, 15]], 1.0, 0.4, 0, -1, 13)], pits: [], seams: [] };
shot('flat', LED, 19.5, 11.6, 1, { before: () => { state.items = [{type:'carrot',x:27.6*UNIT,y:8.2*UNIT},{type:'carrot',x:28.4*UNIT,y:8.2*UNIT}]; for (const [x, y, d] of [[26.9, 8.6, 1], [29, 8.7, -1]]) { const e = makeEnemy('rabbit', x * UNIT, y * UNIT, d); e.mode = 'idle'; e.t = 9; e.cool = 9; state.enemies.push(e); } }, after: () => { dawn(platesLay(FLAT), 0.6); } },
  '3  PLAY. m2 the ledges: two rabbits already squabbling over the carrots inside the horseshoe; the stepping stone behind it is the way in they don\\'t know.  PAINT-OVER: the light');
// 4. m3 hush: inside the stone, dark, the window your lamp, a glowing mushroom at a dead end, the floor wet
const CAVE = { plates: [st([[20, 12], [20, 23]], 0.9, 1.4, 0, -1, 51), st([[24.2, 12], [24.2, 23]], 0.9, 1.4, 0, -1, 52), st([[16, 11.5], [28, 11.5]], 1.0, 1.4, 0, -1, 54), st([[22.1, 11], [22.1, 20]], 2.3, 0.6, 1.4, -1, 53)], pits: [], seams: [] };
shot('flat', CAVE, 22.1, 18.2, 1, { after: () => { const h = state.hero, [X, Y] = pr(h.x / UNIT, h.y / UNIT, 0); ctx.save(); const g = ctx.createRadialGradient(X, Y - 20, 40, X, Y - 20, 260); g.addColorStop(0, 'rgba(8,8,14,0)'); g.addColorStop(0.6, 'rgba(8,8,14,.72)'); g.addColorStop(1, 'rgba(8,8,14,.9)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const [MX, MY] = pr(22.1, 13.2, 0); drawTravelShroom(MX, MY, UNIT * 0.8, true, 0.9, 'flat'); const gl = ctx.createRadialGradient(MX, MY - 20, 5, MX, MY - 20, 150); gl.addColorStop(0, 'rgba(190,140,255,.35)'); gl.addColorStop(1, 'rgba(190,140,255,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(200,210,240,.35)'; ctx.lineWidth = 1.5; for (let k = 0; k < 14; k++) { const x = X - 120 + rnd() * 240, y = Y - 60 + rnd() * 120; ctx.beginPath(); ctx.ellipse(x, y, 8 + rnd() * 14, 3 + rnd() * 5, 0, 0, 6.28); ctx.stroke(); } ctx.restore(); } },
  '4  HUSH. m3 inside the mountain: dark, the window is your lamp, the floor wet, drips; one mushroom glowing in a dead end, the spores\\' home. Pip\\'s voice once, far off, through the stone.  PAINT-OVER: dark, glow, wet');
// 5. m4 struggle: bare ridges, grit streaming west
const BARE = { plates: [st([[4, 8], [12, 7]], 1.2, 0.5, 0, -1, 81), st([[15, 9], [22, 8]], 1.1, 0.45, 0, -1, 82), st([[25, 7.5], [34, 9]], 1.3, 0.5, 0, -1, 83), st([[8, 15], [30, 16]], 1.4, 1.2, 0, -1, 84)], pits: [], seams: [] };
shot('flat', BARE, 18, 8.2, 0.8, { after: () => { ctx.save(); ctx.fillStyle = 'rgba(180,170,150,.12)'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(120,110,95,.45)'; ctx.lineWidth = 1.2; for (let k = 0; k < 160; k++) { const x = rnd() * W, y = rnd() * H, L = 20 + rnd() * 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L, y + L * 0.12); ctx.stroke(); } ctx.restore(); } },
  '5  STRUGGLE. m4 the windy crossing: bare ridges, a wall of stone to shelter behind, grit streaming; the gusts drive you back. Short and loud.  PAINT-OVER: the grit');
// 6. the hollow: relief, the wind gone, grass, a peach tree, the ornithologist's kettle
const HOLLOW = { plates: [st([[6, 6], [12, 4], [20, 3.5], [30, 5], [36, 8]], 1.6, 1.4, 0, -1, 91), st([[36, 8], [37, 14], [35, 20]], 1.6, 1.4, 0, -1, 92), st([[6, 6], [4, 12], [6, 19]], 1.6, 1.4, 0, -1, 93)], pits: [], seams: [] };
shot('flat', HOLLOW, 20, 13, 0.7, { after: () => { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(205,225,170,1)'; ctx.fillRect(0, 0, W, H); ctx.restore(); dawn(platesLay(FLAT), 0.8);
    const [TX, TY] = pr(14, 11, 0); ctx.save(); ctx.translate(TX, TY); drawTree({ x: 0, y: 0, vis: UNIT * 1.6, v: 1, kind: 'tree', pal: 'green', key: 'peach' }); ctx.restore(); for (let k = 0; k < 6; k++) { ctx.fillStyle = '#e8a060'; ctx.beginPath(); ctx.arc(TX - 40 + rnd() * 80, TY - 70 - rnd() * 50, 6, 0, 6.28); ctx.fill(); }
    const [KX, KY] = pr(24, 15, 0); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(KX, KY + 8, 40, 10, 0, 0, 6.28); ctx.fill(); for (let k = 0; k < 7; k++) { ctx.fillStyle = '#6a6a66'; ctx.beginPath(); ctx.arc(KX - 24 + k * 8, KY + 2 + (k % 2) * 3, 5, 0, 6.28); ctx.fill(); } ctx.fillStyle = '#d8b040'; ctx.beginPath(); ctx.ellipse(KX, KY - 10, 11, 8, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = 'rgba(230,230,220,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(KX + 6, KY - 20); ctx.quadraticCurveTo(KX + 16, KY - 40, KX + 8, KY - 58); ctx.stroke();
    ctx.restore(); } },
  '6  RELIEF. The hollow: the wind drops to a breeze, grass again, a peach tree, the ornithologist\\'s kettle on his fire ring, the tortoise somewhere near. The mountain gives back.  PAINT-OVER: green, tree, kettle');
const cols = 2, rows = 3, LH = 56, sheet = createCanvas(W * cols, (H + LH) * rows), g = sheet.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '20px monospace';
shots.forEach(([c, l], i) => { const X = (i % cols) * W, Y = Math.floor(i / cols) * (H + LH); g.drawImage(c, X, Y); g.fillStyle = '#ffe080'; const words = l.split(' '); let line = '', ly = Y + H + 24; for (const w of words) { if (g.measureText(line + ' ' + w).width > W - 30) { g.fillText(line, X + 14, ly); line = w; ly += 24; } else line = line ? line + ' ' + w : w; } g.fillText(line, X + 14, ly); });
fs.writeFileSync('/mnt/user-data/outputs/quest-beats.png', sheet.toBuffer('image/png'));
console.log('wrote quest-beats.png', shots.length, 'moments');
`);
