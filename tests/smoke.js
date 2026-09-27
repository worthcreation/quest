const src = require('./harness.js').src;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const toRiver=()=>{ if(!state.inv.raft) state.inv.raft=1; enterScene('riverbank'); state.cut=null; run(90); const dk=WORLD.riverbank.feat.dock, h=state.hero; h.x=dk[0]*W+UNIT; h.y=dk[1]*H+UNIT*0.5; run(2); state.inv.mats.driftwood=4; state.inv.mats.thorn=2; press('f'); press('f'); run(60*5); };
// autopilot: look ahead, head for the widest gap between rocks
const pilot=()=>{ const r=state.rapids; if(!r||r.phase!=='ride') return;
  const next=r.rocks.filter(k=>k.D>r.dist-0.04).sort((a,b)=>a.D-b.D); const D0=next.length?next[0].D:r.dist+0.3; const row=next.filter(k=>k.D<D0+0.05);
  const [cx,hw]=rapidsChannel(D0); let best=cx, bs=-1e9;
  for(let q=0;q<=40;q++){ const x=cx-hw*0.8+hw*1.6*q/40; const clear=Math.min(...row.map(k=>Math.abs(k.x*W-x)-k.r*UNIT), 1e6); const sc=Math.min(clear, UNIT*3) - Math.abs(x-r.x)*0.02; if(sc>bs){bs=sc;best=x;} }
  const want=Math.max(-UNIT*12, Math.min(UNIT*12, (best-r.x)*5));
  state.keys.arrowright = r.vx < want - UNIT; state.keys.arrowleft = r.vx > want + UNIT; };
let made=0, wrecked=0;
for (let run_=0; run_<6; run_++) {
  toRiver(); console.log('run', run_, 'scene', state.scene, 'planks', state.rapids && state.rapids.planks, 'rocks', state.rapids && state.rapids.rocks.length);
  for (let k=0;k<60*40 && state.scene==='rapids';k++){ pilot(); run(1); }
  state.keys.arrowright=false; state.keys.arrowleft=false; run(120);
  if (state.scene==='gleampool') made++; else wrecked++;
  console.log('  ended in', state.scene, 'planks left', state.rapids ? state.rapids.planks : '-', 'raft stage', state.inv.raft, 'items', state.items.filter(i=>i.type==='driftwood').length);
}
console.log('autopilot made it', made, 'of 6');
// hands off the controls: rocks should wreck you and wash you up at the jetty
let wrecks=0; for (let run_=0; run_<4; run_++){ state.inv.raft=1; toRiver(); for (let k=0;k<60*40 && state.scene==='rapids';k++) run(1); run(120); if (state.scene==='riverbank') wrecks++; }
console.log('no steering: wrecked', wrecks, 'of 4, raft stage', state.inv.raft, 'driftwood', state.inv.mats.driftwood);
// the pool: deep middle pushes back, falls on the east can't be climbed, fishing and tunnel work
state.inv.raft=3; state.inv.tunnel=true; enterScene('gleampool'); state.cut=null; const h=state.hero; const dp=WORLD.gleampool.deep;
h.x=dp.fx*W; h.y=dp.fy*H; run(60); console.log('stepped into deep water -> pushed back', h.falling>0 || !isChasm(h.x,h.y), 'now in deep?', isChasm(h.x,h.y));
h.x=W*0.9; h.y=H*0.5; state.keys.arrowright=true; run(60); state.keys.arrowright=false; console.log('walk into falls: x frac', (h.x/W).toFixed(2));
const spots=fishSpots(WORLD.gleampool); console.log('ripples in shallows (not deep, on screen)', spots.every(([x,y])=>!isChasm(x,y) && x>0 && x<W && y>0 && y<H));
const rod=state.items.find(i=>i.type==='rod'); h.x=rod.x; h.y=rod.y; run(3); const sp=spots[0]; h.x=sp[0]+UNIT*1.2; h.y=sp[1]; run(2); press('f'); let got=false; for(let k=0;k<400&&state.fish;k++){ run(1); if(state.fish&&state.fish.phase==='bite'){ press('f'); got=true; break; } } console.log('fished', got);
const tn=WORLD.gleampool.feat.tunnel; h.x=tn[0]*W; h.y=tn[1]*H; run(2); console.log('tunnel spot dry', !isChasm(h.x,h.y)); press('f'); run(90); console.log('dove to', state.scene);
console.log('errs', errs2);
`);