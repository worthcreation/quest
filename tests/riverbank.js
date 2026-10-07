const src = require('./harness.js').drawn;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null; state.inv.sword=true;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
for (const [w,hh] of [[1280,800],[390,844],[844,390]]) { window.innerWidth=w; window.innerHeight=hh; resize(); enterScene('riverbank'); state.cut=null;
  const f=WORLD.riverbank.feat, root=[f.dock[0]*W,f.dock[1]*H], dir=f.dockDir, len=UNIT*(0.45+WORLD.riverbank.river.w*0.45), tip=[root[0]+dir[0]*len, root[1]+dir[1]*len], waterW=WORLD.riverbank.river.w, overWater=(len-UNIT*0.45)/UNIT;
  const land=dockLanding(); const shack=[f.farside[0]*W,f.farside[1]*H];
  console.log(w+'x'+hh, '| jetty root on land', !isChasm(root[0],root[1]), '| tip over water', isChasm(tip[0],tip[1]), '| foot of jetty dry', !isChasm(land[0]*W,land[1]*H), '| far side (shack side)', (root[0]/W+root[1]/H) < 0.62, '| over the water', overWater.toFixed(2)+' of '+waterW+' tiles ('+Math.round(overWater/waterW*100)+'%)', '| tiles from shack', (Math.hypot(root[0]-shack[0],root[1]-shack[1])/UNIT).toFixed(1)); }
window.innerWidth=1280; window.innerHeight=800; resize();
// from the near bank you can't use it; from Wick's side you can
enterScene('riverbank'); state.cut=null; const h=state.hero, f=WORLD.riverbank.feat;
state.inv.raft=1; state.inv.mats.driftwood=4; state.inv.mats.thorn=2;
h.x=W*0.55; h.y=H*0.6; run(5); let best=99; for (let k=0;k<200;k++){ const x=W*Math.random(), y=H*Math.random(); if (!isChasm(x,y) && (x/W+y/H)>0.62) best=Math.min(best, Math.hypot(x-f.dock[0]*W, y-f.dock[1]*H)/UNIT); }
console.log('closest the near bank gets to the jetty:', best.toFixed(1), 'tiles (needs 2.2 to use it)');
const [lx,ly]=dockLanding(); h.x=lx*W; h.y=ly*H; run(3); console.log('at the foot of the jetty: hint', state.actionHint && state.actionHint.verb);
press('f'); console.log('built the raft', state.inv.raft===2); press('f'); console.log('launch ->', state.cut && state.cut.type); run(60*5); console.log('now in', state.scene);
console.log('errs', errs2);
`);