// A still, not game code (handoff 2 Oct): run from the repo root after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`; writes PNGs to /mnt/user-data/outputs (repoint on Windows). See HANDOFF.md, The mountain reimagined.
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
state.started=true; state.intro=null; state.pip=null; state.inv.story=STORY.adventure; state.inv.sword=true; enterScene('peak1', 0.5, 0.6); state.cut=null; for (let k=0;k<20;k++) update(1/60); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.time=3.7;
const u = UNIT;
let S=17; const rnd=()=>(S=(S*9301+49297)%233280)/233280, r2=(a,b)=>a+rnd()*(b-a);
const path=pts=>{ ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); };
const rgb=(c,k=1,d=0)=>'rgb('+c.map(v=>Math.max(0,Math.min(255,Math.round(v*k+d)))).join(',')+')';
const rgba=(c,a,k=1)=>'rgba('+c.map(v=>Math.max(0,Math.min(255,Math.round(v*k)))).join(',')+','+a+')';
const MODE=process.env.MODE||'misty';
const P = { misty: { stone:[142,146,138], moss:[96,132,70], grass:[168,160,96], earth:[128,104,74], face:[96,92,84], sky:['#b9cfe0','#e4e8e2'], mist:0.55, warm:0 },
            overcast: { stone:[128,131,126], moss:[86,112,66], grass:[150,144,96], earth:[112,94,70], face:[84,82,78], sky:['#9aa4ad','#c7cbc8'], mist:0.3, warm:0 },
            late: { stone:[150,138,118], moss:[110,124,62], grass:[186,156,88], earth:[134,100,62], face:[98,84,66], sky:['#8fa3c2','#f0c88c'], mist:0.25, warm:1 } }[MODE];
// ---- the stone slab: one body of cracked rock, lit from the west, moss in its cracks
function slab(cx, cy, w, h, seed, opt={}) {
  let s0=S; S=Math.floor(seed*977)%233280;
  const n=12, pts=[]; for (let i=0;i<n;i++){ const a=i/n*6.28, k=0.78+rnd()*0.34; pts.push([cx+Math.cos(a)*w*k/2, cy+Math.sin(a)*h*k/2]); }
  path(pts); ctx.fillStyle=rgb(P.stone, opt.k||1); ctx.fill();
  ctx.save(); path(pts); ctx.clip();
  for (let f=0;f<6;f++){ const fx=cx+(rnd()-.5)*w*.7, fy=cy+(rnd()-.5)*h*.7, fw=w*(.25+rnd()*.4), fh=h*(.25+rnd()*.4), lit=rnd()<0.5; ctx.fillStyle=rgba(lit?[255,255,255]:[0,0,0], 0.08+rnd()*0.07); ctx.beginPath(); for(let i=0;i<7;i++){ const a=i/7*6.28; i?ctx.lineTo(fx+Math.cos(a)*fw*(.7+rnd()*.5)/2, fy+Math.sin(a)*fh*(.7+rnd()*.5)/2):ctx.moveTo(fx+fw/2,fy);} ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle='rgba(30,28,24,.55)'; ctx.lineWidth=1.3; for (let c=0;c<4;c++){ let x=cx+(rnd()-.5)*w*.6, y=cy+(rnd()-.5)*h*.6, a=rnd()*6.28; ctx.beginPath(); ctx.moveTo(x,y); for(let i=0;i<5;i++){ a+=(rnd()-.5)*1.2; x+=Math.cos(a)*w*.12; y+=Math.sin(a)*h*.12; ctx.lineTo(x,y);} ctx.stroke(); }
  for (let m=0;m<5;m++){ const mx=cx+(rnd()-.5)*w*.9, my=cy+(rnd()-.5)*h*.9; ctx.fillStyle=rgba(P.moss,0.45); ctx.beginPath(); ctx.ellipse(mx,my,w*(.05+rnd()*.08),h*(.03+rnd()*.05),rnd()*3,0,6.28); ctx.fill(); }
  ctx.restore();
  // the lit rim (north-west) and the shadow edge (south-east)
  ctx.lineWidth=2; for (let i=0;i<n;i++){ const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%n], nx=by-ay, ny=-(bx-ax), L=Math.hypot(nx,ny)||1, lit=(-nx-ny*0.6)/L; ctx.strokeStyle=lit>0.2?'rgba(255,255,250,.35)':lit<-0.2?'rgba(20,18,14,.6)':'rgba(40,36,30,.3)'; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke(); }
  if (!opt.flat) { ctx.fillStyle='rgba(20,18,14,.22)'; ctx.beginPath(); ctx.ellipse(cx+w*.08, cy+h*.55, w*.5, h*.18, 0, 0, 6.28); ctx.fill(); }   // its shadow on the ground
  S=s0;
}
// ---- a cliff face under a tier's edge: a band from the lip line down, lit at the top, dark at the foot, strata and vertical cracks, moss drips
function face(lip, hgt, seed) {
  let s0=S; S=Math.floor(seed*131)%233280;
  const bot=lip.map(([x,y])=>[x+Math.sin(y*0.03+x*0.01)*4, y+hgt]);
  const g=ctx.createLinearGradient(0, lip[0][1], 0, lip[0][1]+hgt); g.addColorStop(0, rgb(P.face,1.35)); g.addColorStop(0.5, rgb(P.face,1.0)); g.addColorStop(1, rgb(P.face,0.55));
  path([...lip, ...bot.slice().reverse()]); ctx.fillStyle=g; ctx.fill();
  ctx.save(); path([...lip, ...bot.slice().reverse()]); ctx.clip();
  for (let i=0;i<lip.length-1;i++){ const [ax,ay]=lip[i],[bx,by]=lip[i+1]; const L=Math.hypot(bx-ax,by-ay); for (let k=0;k<L/14;k++){ const t=k/(L/14), x=ax+(bx-ax)*t+(rnd()-.5)*6, y0=ay+(by-ay)*t; const d=rnd()<0.5; ctx.strokeStyle=d?'rgba(20,18,14,.5)':'rgba(255,255,240,.18)'; ctx.lineWidth=d?1.5:1; ctx.beginPath(); ctx.moveTo(x, y0+2); ctx.lineTo(x+(rnd()-.5)*10, y0+hgt*(0.4+rnd()*0.6)); ctx.stroke(); } }
  for (const t of [0.3,0.62]) { ctx.strokeStyle='rgba(30,26,20,.35)'; ctx.lineWidth=1.5; ctx.beginPath(); lip.forEach(([x,y],i)=>{ const yy=y+hgt*(t+0.05*Math.sin(i*0.9+seed)); i?ctx.lineTo(x,yy):ctx.moveTo(x,yy); }); ctx.stroke(); }
  for (let i=0;i<lip.length;i+=2){ const [x,y]=lip[i]; if (rnd()<0.6) continue; ctx.fillStyle=rgba(P.moss,0.55); ctx.beginPath(); ctx.ellipse(x+rnd()*8, y+4, 7+rnd()*10, 3+rnd()*4, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(x+4, y+10+rnd()*hgt*.3, 2.5, 8+rnd()*hgt*.25, 0, 0, 6.28); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle='#1c1812'; ctx.lineWidth=3; ctx.beginPath(); lip.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke();
  ctx.strokeStyle='rgba(235,232,200,.5)'; ctx.lineWidth=1.6; ctx.beginPath(); lip.forEach(([x,y],i)=>i?ctx.lineTo(x,y-3):ctx.moveTo(x,y-3)); ctx.stroke();
  ctx.fillStyle='rgba(10,10,12,.35)'; path([...bot, ...bot.map(([x,y])=>[x,y+18]).reverse()]); ctx.fill();   // the foot in shadow
  S=s0;
}
// ---- ground: stone under dry grass, moss and bare earth in patches, slab outcrops breaking through, tufts
function ground(poly, seed, grassy) {
  let s0=S; S=seed;
  ctx.save(); path(poly); ctx.clip();
  ctx.fillStyle=rgb(P.stone,1.02); ctx.fillRect(0,0,W,H);
  const xs=poly.map(p=>p[0]), ys=poly.map(p=>p[1]), x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  for (let i=0;i<260;i++){ const x=r2(x0,x1), y=r2(y0,y1), kind=rnd(); const c= kind<0.45?P.grass: kind<0.75?P.moss: kind<0.9?P.earth:P.stone; ctx.fillStyle=rgba(c, 0.22+rnd()*0.22, 0.9+rnd()*0.25); ctx.beginPath(); ctx.ellipse(x,y,u*(0.5+rnd()*1.6),u*(0.3+rnd()*0.9),rnd()*3,0,6.28); ctx.fill(); }
  for (let i=0;i<700;i++){ const x=r2(x0,x1), y=r2(y0,y1); ctx.fillStyle=rnd()<0.5?'rgba(255,255,240,.12)':'rgba(40,36,30,.12)'; ctx.fillRect(x,y,2,1.5); }   // grit
  for (let i=0;i<140;i++){ const x=r2(x0,x1), y=r2(y0,y1); ctx.strokeStyle=rnd()<0.6?rgba(P.grass,0.8,0.8):rgba(P.moss,0.8,1.1); ctx.lineWidth=1.3; for (let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(x+k*3,y); ctx.lineTo(x+k*4+(rnd()-.5)*3, y-u*0.3); ctx.stroke(); } }
  ctx.restore(); S=s0;
}
// ======================= the frame =======================
// the sky and far ridges, seen because the view is tipped up as on the rise's far end
{ const g=ctx.createLinearGradient(0,0,0,H*0.3); g.addColorStop(0,P.sky[0]); g.addColorStop(1,P.sky[1]); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
for (const [k,yb,col] of [[0.006,150,'rgba(120,132,150,.55)'],[0.011,185,'rgba(96,104,118,.75)']]) { ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,H); for (let x=0;x<=W;x+=16) ctx.lineTo(x, yb-60*Math.abs(Math.sin(x*k+1))-25*Math.sin(x*k*3.1)); ctx.lineTo(W,H); ctx.closePath(); ctx.fill(); }
// ---- the valley far below, off the east edge (the High Reaches' vista): the sheer side of the mountain
const edgeX=y=>W*0.80+Math.sin(y*0.012)*30+Math.sin(y*0.05)*8;
ctx.save(); ctx.beginPath(); ctx.moveTo(W,120); for (let y=120;y<=H;y+=18) ctx.lineTo(edgeX(y)+u*1.6,y); ctx.lineTo(W,H); ctx.closePath(); ctx.clip(); drawValleyBelow(W*0.72, 120, W*0.3, H-120, 1); ctx.fillStyle='rgba(205,220,235,.45)'; ctx.fillRect(0,0,W,H); ctx.restore();
// ---- tier 3 (top, far): a high shelf
const t3=[[0,120],[W*0.56,118],[W*0.62,150],[W*0.60,236],[W*0.52,262],[W*0.22,270],[0,280]];
ground(t3, 4401);
const lip3=[]; for (let x=0;x<=W*0.62;x+=22) lip3.push([x, (x<W*0.22?280-10*(x/(W*0.22)):x<W*0.52?270-8*Math.sin((x-W*0.22)/(W*0.3)*3.14):262-26*((x-W*0.52)/(W*0.1)))+Math.sin(x*0.07)*4]);
// ---- tier 2 (middle): the main ground, a gorge cut through it (the river at its bottom), slabs along the lips
const t2=[[0,282],[W*0.62,262],[W*0.70,330],[edgeX(400),400],[edgeX(500),500],[edgeX(560),560],[W*0.60,590],[W*0.30,610],[0,600]];
ground(t2, 9013);
face(lip3, 92, 3);
{ // the gorge: a winding dark cut from the top face (the fall) down and east to the edge
  const gc=[]; for (let t=0;t<=1;t+=0.04) gc.push([W*0.42+t*W*0.33+Math.sin(t*7)*40, 300+t*280+Math.sin(t*4.5)*22]);
  const hw=t=>u*(0.55+0.35*Math.sin(t*5+1)+0.35*t), L=gc.map(([x,y],i)=>[x-hw(i/25)*0.7, y+hw(i/25)*0.7]), R=gc.map(([x,y],i)=>[x+hw(i/25)*0.7, y-hw(i/25)*0.7]);
  const hole=[...L, ...R.slice().reverse()];
  path(hole); ctx.fillStyle='#0b0d10'; ctx.fill();
  ctx.save(); path(hole); ctx.clip();
  for (let i=0;i<gc.length-1;i++){ const [ax,ay]=R[i],[bx,by]=R[i+1]; const g=ctx.createLinearGradient(ax,ay,ax-u*0.9,ay+u*0.8); g.addColorStop(0,rgb(P.face,1.25)); g.addColorStop(0.4,rgb(P.face,0.8)); g.addColorStop(1,'#0b0d10'); ctx.fillStyle=g; path([[ax,ay],[bx,by],[bx-u*0.9,by+u*0.8],[ax-u*0.9,ay+u*0.8]]); ctx.fill(); ctx.strokeStyle='rgba(20,18,14,.4)'; ctx.lineWidth=1; for (let k=0.3;k<1;k+=0.3){ ctx.beginPath(); ctx.moveTo(ax-u*0.9*k,ay+u*0.8*k); ctx.lineTo(bx-u*0.9*k,by+u*0.8*k); ctx.stroke(); } }   // the far wall, lit
  ctx.strokeStyle='rgba(70,120,140,.6)'; ctx.lineWidth=3; ctx.beginPath(); gc.forEach(([x,y],i)=>{ const X=x-u*0.5, Y=y+u*0.6; i?ctx.lineTo(X,Y):ctx.moveTo(X,Y); }); ctx.stroke(); ctx.strokeStyle='rgba(190,225,240,.35)'; ctx.lineWidth=1; ctx.stroke();
  ctx.restore();
  ctx.strokeStyle='#1c1812'; ctx.lineWidth=3; path(hole); ctx.stroke();
  for (let i=0;i<22;i++){ const k=i/22, side=rnd()<0.5?L:R, [x,y]=side[Math.min(side.length-1,Math.floor(k*side.length))]; const away=side===L?[-1,1]:[1,-1]; slab(x+away[0]*u*(0.9+rnd()*1.2), y+away[1]*u*(0.6+rnd()*0.9), u*(1.2+rnd()*1.6), u*(0.8+rnd()*1.0), i*3.3+7); }
}
// slabs breaking the ground elsewhere, a few big ones
for (const [x,y,w,h] of [[W*0.12,360,3.2,2.0],[W*0.24,470,2.4,1.6],[W*0.09,520,1.8,1.1],[W*0.33,330,1.6,1.0],[W*0.63,470,2.0,1.3],[W*0.2,160,2.6,1.6],[W*0.42,190,1.9,1.2],[W*0.55,225,1.4,0.9]]) slab(x,y,u*w,u*h,x*0.7+y);
// the stairs cut in the top face, where it's lowest
{ const sx=W*0.34, sy=270; for (let i=0;i<7;i++){ const y=sy+i*13, w=u*1.1; ctx.fillStyle=rgb(P.face,1.25-i*0.06); ctx.fillRect(sx-w/2+i*1.5, y, w, 10); ctx.fillStyle='rgba(20,18,14,.45)'; ctx.fillRect(sx-w/2+i*1.5, y+9, w, 3); } }
// the fall off the top tier into the gorge, and its mist
{ const fx=W*0.44, fy=262; ctx.fillStyle='rgba(225,238,245,.85)'; path([[fx-10,fy],[fx+10,fy],[fx+18,fy+96],[fx-18,fy+96]]); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=2; for (let i=0;i<6;i++){ const o=(i*23)%60; ctx.beginPath(); ctx.moveTo(fx-7+i*3, fy+o); ctx.lineTo(fx-7+i*3, fy+o+22); ctx.stroke(); }
  for (let i=0;i<14;i++){ ctx.fillStyle='rgba(240,246,250,'+(0.18+rnd()*0.2)+')'; ctx.beginPath(); ctx.ellipse(fx+(rnd()-.5)*110, fy+70+rnd()*70, 24+rnd()*40, 14+rnd()*22, 0, 0, 6.28); ctx.fill(); } }
// ---- tier 2's face, and tier 1 (near, low) under it
const lip2=[]; for (let x=0;x<=W*0.62;x+=22) lip2.push([x, (x<W*0.3?600+10*(x/(W*0.3)):590+20*Math.sin((x-W*0.3)/(W*0.32)*3.14))+Math.sin(x*0.09)*5]);
const t1=[[0,560],[W*0.62,560],[W*0.66,660],[edgeX(700),700],[edgeX(800),800],[0,800]];
ground(t1, 2207);
face(lip2, 120, 11);
for (const [x,y,w,h] of [[W*0.15,760,2.6,1.6],[W*0.45,770,2.0,1.3],[W*0.58,740,1.6,1.0]]) slab(x,y,u*w,u*h,x+y*0.3);
// ---- the sheer east edge: a wall down to the valley, and the brink
{ const E=[]; for (let y=140;y<=H+20;y+=18) E.push([edgeX(y),y]); const far=E.map(([x,y])=>[x+u*2.2+Math.sin(y*0.04)*8, y-u*0.3]);
  const g=ctx.createLinearGradient(W*0.78,0,W*0.9,0); g.addColorStop(0,rgb(P.face,1.1)); g.addColorStop(1,rgba(P.face,0,0.6)); ctx.fillStyle=g; path([...E, ...far.slice().reverse()]); ctx.fill();
  ctx.strokeStyle='#1c1812'; ctx.lineWidth=3; ctx.beginPath(); E.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke(); }
// ---- the mountain itself, standing up at the far side: heaped slabs and dark masses above the top shelf
for (let i=0;i<26;i++){ const x=r2(-30,W*0.7), y=r2(90,150), w=u*(1.2+rnd()*3), h=u*(1.0+rnd()*2.2); slab(x,y,w,h,i*5+1,{k:0.85+rnd()*0.25, flat:true}); }
// ---- mist lying in the low places
{ ctx.fillStyle='rgba(235,240,244,'+P.mist*0.5+')'; for (let i=0;i<10;i++){ ctx.beginPath(); ctx.ellipse(r2(0,W*0.6), r2(640,790), u*(2+rnd()*4), u*(0.7+rnd()*1), 0, 0, 6.28); ctx.fill(); }
  const g=ctx.createLinearGradient(0,H*0.75,0,H); g.addColorStop(0,'rgba(235,240,244,0)'); g.addColorStop(1,'rgba(235,240,244,'+P.mist*0.7+')'); ctx.fillStyle=g; ctx.fillRect(0,H*0.75,W*0.72,H*0.25); }
// ---- the hero on the middle tier, birds
const h=state.hero; h.x=W*0.27; h.y=440; h.fx=1; h.fy=0; drawHero();
state.vistaBirds=[{fx:0.3,k:0.5,sp:0.04,ph:1},{fx:0.6,k:0.8,sp:0.04,ph:2},{fx:0.8,k:0.3,sp:0.04,ph:0}]; drawRisingBirds(W*0.72,160,W*0.3,H-160);
{ for (const [x,y,s] of [[W*0.55,330,14],[W*0.60,345,9],[W*0.22,205,11]]) { ctx.strokeStyle='rgba(40,40,50,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x-s,y-s*0.35); ctx.lineTo(x,y); ctx.lineTo(x+s,y-s*0.35); ctx.stroke(); } }
// ---- the light: warm from the west late in the day, cool otherwise; one low cloud shadow
if (P.warm) { const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,'rgba(255,190,110,.18)'); g.addColorStop(1,'rgba(60,50,90,.22)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
if (MODE==='overcast') { ctx.fillStyle='rgba(120,128,140,.14)'; ctx.fillRect(0,0,W,H); }
{ const g=ctx.createRadialGradient(W*0.5,520,0,W*0.5,520,u*7); g.addColorStop(0,'rgba(20,25,35,.16)'); g.addColorStop(1,'rgba(20,25,35,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
drawHUD && drawHUD();
fs.writeFileSync('/mnt/user-data/outputs/quest-mood-m1-'+MODE+'.png', canvas.toBuffer('image/png')); console.log('written', MODE);
`);
