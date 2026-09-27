
// =====================================================================
// World overview: every screen of one seed laid out as a map.
// Open index.html?overview for a random world or ?overview=12345 for a seed.
// =====================================================================
const MAP_LAYOUT = {
  farbank: [2, 0],
  rapids: [0, 1], ford: [2, 1], riverbank: [3, 1], camp: [4, 1],
  gleampool: [0, 2], meadow2: [2, 2], meadow: [3, 2], start: [4, 2], w1: [5, 2], w2: [6, 2], w3: [7, 2],
  foot: [3, 3], f1: [4, 3], peak1: [5, 9], peak2: [5, 8], peak3: [5, 7], f2: [4, 4], f3: [4, 5], f4: [4, 6], f5: [4, 7], f6: [4, 8], f7: [4, 9],
  c1: [7, 3], c2: [7, 4], c3: [7, 5], c4: [7, 6], c5: [7, 7], c6: [7, 8], c7: [7, 9],
  fallsbank: [8, 9], m1: [9, 9], m2: [10, 9], m3: [11, 9], h1: [12, 9], h2: [13, 9], h3: [14, 9],
  sw1: [10, 10], sw2: [10, 11], sw3: [10, 12],
};
const MAP_NAMES = { peak3: 'Summit', rapids: 'The rapids', gleampool: 'Gleaming pool', fallsbank: 'Falls bank', camp: 'Home camp', start: 'The glade', meadow: 'Meadow', meadow2: 'Rocky meadow', riverbank: 'Riverbank', ford: 'The ford', farbank: 'Far bank', foot: 'Foothill farm' };
const REGION_COLOR = { peak: '#a8a29a', river: '#5ab0c8', forest: '#7fc47a', woods: '#3f9a52', field: '#c9c06a', cave: '#8a7aa8', marsh: '#7aa88a', swamp: '#5a8a6a', hollow: '#a86a6a' };

function renderOverview(seed) {
  const TW = 256, TH = 160, GAP = 40, M = 60, HEAD = 110;
  const cols = 15, rows = 13;
  resetRun(seed);
  W = GEN.W; H = GEN.H; computeUnit();
  lightCv.width = W / 2; lightCv.height = H / 2;
  const OW = M * 2 + cols * TW + (cols - 1) * GAP, OH = M * 2 + HEAD + rows * TH + (rows - 1) * GAP;
  canvas.width = OW; canvas.height = OH;
  const at = id => { const [c, r] = MAP_LAYOUT[id]; return [M + c * (TW + GAP), M + HEAD + r * (TH + GAP)]; };
  const center = id => { const [x, y] = at(id); return [x + TW / 2, y + TH / 2]; };

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#14121a'; ctx.fillRect(0, 0, OW, OH);
  ctx.fillStyle = '#fdf6e3'; ctx.font = 'bold 44px Georgia, serif'; ctx.fillText('Quest: world overview', M, M + 40);
  ctx.font = '22px "Courier New", monospace'; ctx.fillStyle = '#d8d0c0';
  ctx.fillText(`seed ${seed}   ·   ${Object.keys(MAP_LAYOUT).length} screens   ·   lines are walkable, dashed purple is the sinkhole, dashed blue the raft and the tunnel`, M, M + 80);
  let lx = M + 1900;
  for (const [area, col] of Object.entries(REGION_COLOR)) { ctx.fillStyle = col; ctx.fillRect(lx, M + 62, 22, 22); ctx.fillStyle = '#d8d0c0'; ctx.fillText(AREA_NAMES[area].replace('The ', ''), lx + 30, M + 80); lx += 30 + ctx.measureText(AREA_NAMES[area].replace('The ', '')).width + 34; }

  // connections first, underneath the screens
  const drawn = new Set();
  ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (const [id, sc] of Object.entries(WORLD)) for (const ex of sc.exits) {
    const key = [id, ex.to].sort().join('-');
    if (drawn.has(key) || !MAP_LAYOUT[ex.to] || !MAP_LAYOUT[id]) continue;
    drawn.add(key);
    const [ax, ay] = center(id), [bx, by] = center(ex.to);
    ctx.strokeStyle = ex.locked ? '#a0885a' : '#6a6478';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }
  ctx.setLineDash([14, 12]); ctx.strokeStyle = '#8a7aa8';
  { const [ax, ay] = center('w3'), [bx, by] = center('c1'); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
  ctx.strokeStyle = '#5ab0c8';                                                          // downriver by raft, and the tunnel
  { const [ax, ay] = center('riverbank'), [bx, by] = center('rapids'); ctx.beginPath(); ctx.moveTo(ax, ay - 40); ctx.quadraticCurveTo((ax + bx) / 2, ay - 120, bx, by); ctx.stroke(); }
  { const [ax, ay] = center('gleampool'), [bx, by] = center('fallsbank'); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, by + 260, bx, by); ctx.stroke(); }
  ctx.setLineDash([]);

  // each screen, drawn by the game's own painter at thumbnail scale
  const s = TW / W;
  for (const id of Object.keys(MAP_LAYOUT)) {
    const sc = WORLD[id];
    enterScene(id);
    const h = state.hero; h.x = -9999; h.y = -9999;
    state.texts = []; state.title = null; state.fx = []; state.glimpse = null;
    const shade = sc.shade; sc.shade = Math.min(shade || 0, 0.35);   // dim, not black, so dark screens can be read
    const [x, y] = at(id);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, TW, TH); ctx.clip();
    ctx.setTransform(s, 0, 0, s, x, y);
    try { drawScene(sc); } catch (e) { console.error('overview', id, e); }
    ctx.restore();
    sc.shade = shade;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = REGION_COLOR[sc.area] || '#888'; ctx.lineWidth = 4; ctx.strokeRect(x - 2, y - 2, TW + 4, TH + 4);
    // label and notes
    const notes = [];
    if (sc.feat.shroom) notes.push('mushroom');
    if (sc.feat.plots && sc.feat.plots.length) notes.push(`${sc.feat.plots.length} plots`);
    const beans = sc.initItems.filter(i => i.type === 'bean').length; if (beans) notes.push(`${beans} bean${beans > 1 ? 's' : ''}`);
    if (sc.spawns.length) notes.push(`${sc.spawns.length} foe${sc.spawns.length > 1 ? 's' : ''}`);
    ctx.fillStyle = 'rgba(10,8,14,.78)'; ctx.fillRect(x, y + TH - 26, TW, 26);
    ctx.fillStyle = '#fdf6e3'; ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillText(`${id}  ${MAP_NAMES[id] || ''}`.trim(), x + 6, y + TH - 9);
    ctx.fillStyle = '#c9c0a8'; ctx.font = '12px "Courier New", monospace';
    const n = notes.join(', '); ctx.fillText(n, x + TW - 6 - ctx.measureText(n).width, y + TH - 9);
  }
  return { width: OW, height: OH };
}

// in the browser: ?overview shows the map instead of the game
function startOverview(param) {
  const seed = param && /^\d+$/.test(param) ? Number(param) >>> 0 : (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  document.querySelectorAll('#pad, .abtn, #start, #fsTip').forEach(el => el.remove && el.remove());
  const meta = document.querySelector('meta[name="viewport"]'); if (meta) meta.setAttribute('content', 'width=device-width, initial-scale=0.3');
  document.documentElement.style.overflow = 'auto'; document.body.style.overflow = 'auto'; document.body.style.touchAction = 'auto'; document.body.style.height = 'auto';
  const size = renderOverview(seed);
  canvas.style.position = 'static'; canvas.style.width = size.width + 'px'; canvas.style.height = size.height + 'px';
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:10px;right:10px;display:flex;gap:8px;font:14px "Courier New",monospace;z-index:9';
  const btn = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = 'background:#2a2632;color:#fdf6e3;border:0;border-radius:6px;padding:8px 12px;font:inherit'; b.onclick = fn; bar.appendChild(b); };
  btn('Download PNG', () => { const a = document.createElement('a'); a.download = `quest-map-${seed}.png`; a.href = canvas.toDataURL('image/png'); a.click(); });
  btn('New seed', () => { location.search = '?overview'; });
  btn('Play this world', () => { location.search = `?seed=${seed}`; });
  document.body.appendChild(bar);
}
