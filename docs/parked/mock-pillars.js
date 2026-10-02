// A still, not game code (2 Oct, after 213): mt2's island pillars shaded as solid stone instead of as a hole's walls.
// AFTER=1 swaps in the proposed painter (below); without it, the game's own (213) for comparison. Lit by facing (the
// light from the west, 0.5 to 1, the plates' rule), ONE gradient per pillar along its axis (lip band, lit stone, into
// the drop's dark by about halfway), the wall filled as one shape with the facing laid over it, faint strata that fade
// with depth, pillars painted outermost first. Run from the repo root after `npm install --no-save @napi-rs/canvas` and
// `node tools/build.js`; AT=x,y puts the hero; ZOOM=0.5 pulls the frame back. Writes /mnt/user-data/outputs.
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
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
const AT=(process.env.AT||'34,17').split(',').map(Number), ZOOM=+process.env.ZOOM||1, AFTER=!!process.env.AFTER;
state.started=true; state.intro=null; startTestScene('mt2', AT[0]/40, AT[1]/24); for (let k=0;k<10;k++) update(1/60); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[];
if (AFTER) {
  // outermost first: a pillar's wall reaches in toward the middle of the view, under the ones nearer it
  const c=state.mtn, d=i=>{ const [X,Y]=mtnProj(i.x,i.y,mtnH(M2,i.x,i.y),c); return Math.hypot(X-W/2,Y-H/2); }; M2.isls.sort((a,b)=>d(b)-d(a));
  drawMtnPillar = function (m, isl, rv, s, gp) {
    const CX=W/2, CY=H/2, k=rv.k, drop=rv.drop, us=UNIT*s, tone=134;
    const T=islRing(isl, 0, 64).map(([x,y])=>gp(x,y)), F=T.map(([X,Y])=>[CX+(X-CX)*k, CY+(Y-CY)*k+drop*k]), n=T.length;
    const cT=T.reduce((a,q)=>[a[0]+q[0]/n,a[1]+q[1]/n],[0,0]), cF=F.reduce((a,q)=>[a[0]+q[0]/n,a[1]+q[1]/n],[0,0]);
    // which edges show: the foot lies outward of the lip (the wall faces the eye)
    const seg=[]; for (let i=0;i<n;i++){ const j=(i+1)%n, ex=T[j][0]-T[i][0], ey=T[j][1]-T[i][1], L=Math.hypot(ex,ey)||1; let nx=ey/L, ny=-ex/L; const mx=(T[i][0]+T[j][0])/2, my=(T[i][1]+T[j][1])/2; if ((mx-cT[0])*nx+(my-cT[1])*ny<0){nx=-nx;ny=-ny;}
      const fx=(F[i][0]+F[j][0])/2-mx, fy=(F[i][1]+F[j][1])/2-my; seg.push({i,j,nx,ny,seen:fx*nx+fy*ny>0.2, lit:mtnClamp(0.8+0.25*(-nx)-0.05*ny,0.6,1)}); }
    // one gradient along the pillar: from just above its lip ring to its foot, into the drop's dark by about halfway
    const ax=cF[0]-cT[0], ay=cF[1]-cT[1], AL=Math.hypot(ax,ay)||1, r=Math.max(...T.map(q=>Math.hypot(q[0]-cT[0],q[1]-cT[1]))), ux=ax/AL, uy=ay/AL;
    const g0=[cT[0]-ux*r*0.6, cT[1]-uy*r*0.6], g1=[cF[0]+ux*r*0.6, cF[1]+uy*r*0.6], col=v=>'rgb('+Math.round(v)+','+Math.round(v+2)+','+Math.round(v-5)+')';
    const g=ctx.createLinearGradient(g0[0],g0[1],g1[0],g1[1]); g.addColorStop(0,col(tone*0.55)); g.addColorStop(0.07,col(tone*1.0)); g.addColorStop(0.3,col(tone*0.82)); g.addColorStop(0.55,col(tone*0.42)); g.addColorStop(0.78,'rgb(16,20,24)'); g.addColorStop(1,'#0c1014');
    const quad=sg=>{ ctx.moveTo(T[sg.i][0],T[sg.i][1]); ctx.lineTo(T[sg.j][0],T[sg.j][1]); ctx.lineTo(F[sg.j][0],F[sg.j][1]); ctx.lineTo(F[sg.i][0],F[sg.i][1]); ctx.closePath(); };
    ctx.beginPath(); for (const sg of seg) if (sg.seen) quad(sg); ctx.fillStyle=g; ctx.fill('nonzero');   // one shape, one gradient: no seams, no bands
    // the facing laid over it, smoothed along the ring (a pillar is round: its shade turns, it doesn't step)
    const lit=seg.map((sg,i)=>{ let t=0,w=0; for(let d=-3;d<=3;d++){ const q=seg[(i+d+n)%n]; t+=q.lit*(4-Math.abs(d)); w+=4-Math.abs(d);} return t/w; });
    for (const sg of seg) { if (!sg.seen) continue; const a=1-lit[sg.i]; if (a<0.01) continue; ctx.beginPath(); quad(sg); ctx.fillStyle='rgba(0,0,0,'+a.toFixed(3)+')'; ctx.fill(); ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=0.6; ctx.stroke(); }
    // strata: faint rings round the seen side, fading with depth
    for (const [t,a] of [[0.12,0.26],[0.24,0.18],[0.4,0.1]]) { ctx.strokeStyle='rgba(28,26,22,'+a+')'; ctx.lineWidth=Math.max(1,1.2*s); ctx.beginPath(); let pen=false; for (let i=0;i<=n;i++){ const q=i%n; if(!seg[q].seen&&!seg[(q-1+n)%n].seen){pen=false;continue;} const w=t+0.015*Math.sin(q*0.9+isl.s*5), x=T[q][0]+(F[q][0]-T[q][0])*w, y=T[q][1]+(F[q][1]-T[q][1])*w; pen?ctx.lineTo(x,y):ctx.moveTo(x,y); pen=true; } ctx.stroke(); }
  };
}
if (ZOOM !== 1) { M2.fixed.zoom *= ZOOM; mtnCamera(0, state.mtn, true); }   // (pulled back: the view's own zoom; draw() sets its own transform)
draw();
const name='/mnt/user-data/outputs/quest-pillars-'+(AFTER?'after':'before')+(ZOOM===1?'':'-'+ZOOM)+'.png';
fs.writeFileSync(name, canvas.toBuffer('image/png')); console.log('written', name);
`);
