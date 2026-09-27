const src = require('./harness.js').src;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null; state.inv.sword=true;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
enterScene('f3'); state.cut=null; state.enemies=[];
// the rhythm: record phases for 20 seconds
const seq=[]; let lastPh=''; for (let k=0;k<60*20;k++){ update(1/60); if (state.gustPhase!==lastPh){ lastPh=state.gustPhase; seq.push(lastPh+'('+WORLD.f3.gusts[state.gustIdx].a.toFixed(1)+')'); } }
console.log('rhythm:', seq.slice(0,14).join(' > '));
// gentle gusts nudge, the strong one shoves: measured on open ground, away from ledges and walls
const h=state.hero; const sc=WORLD.f3; let spot=null;
for (let q=0;q<200 && !spot;q++){ const x=W*(0.15+0.7*Math.random()), y=H*(0.13+0.8*Math.random()); if(!onRock(sc,x,y,-UNIT*1.2) && !isChasm(x,y,UNIT*1.2) && !state.solids.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+UNIT*1.3)) spot=[x,y]; }
const push={}; state.cut=null; state.enemies=[]; h.vig=maxVig();
for (const ph of ['gentle','blow']) { h.x=spot[0]; h.y=spot[1]; h.vx=h.vy=0; h.falling=0; h.ride=null; h.z=0; state.gustIdx=1; console.log('  spot', (spot[0]/W).toFixed(2),(spot[1]/H).toFixed(2), 'busy', state.busy, 'cut', state.cut && state.cut.type, 'stun', h.stun); for(let k=0;k<30;k++){ state.gustPhase=ph; state.gustT=0; state.gust= ph==='blow'?1:0.4; update(1/60);} push[ph]=(Math.hypot(h.x-spot[0],h.y-spot[1])/UNIT).toFixed(2); }
console.log('half a second of wind moves you: gentle', push.gentle, 'tiles, strong', push.blow, 'tiles');
// jumping in a gentle gust is a plain jump; in the strong gust it rides
const top=sc.rocks.filter(r=>r.ledge).sort((a,b)=>a.fy-b.fy)[0];
enterScene('f3'); state.cut=null; state.enemies=[]; h.x=top.fx*W; h.y=top.fy*H; update(1/60);
state.gustIdx=0; state.gustStep=3; state.gustPhase='gentle'; state.gustT=0; state.keys[' ']=true; update(1/60); state.keys[' ']=false; console.log('jump in a gentle gust rides?', !!h.ride); run(90);
enterScene('f3'); state.cut=null; state.enemies=[]; h.x=top.fx*W; h.y=top.fy*H; update(1/60);
state.gustIdx=0; state.gustStep=5; state.gustPhase='blow'; state.gustT=1.4; state.keys[' ']=true; update(1/60); state.keys[' ']=false;
console.log('jump late in the strong gust rides?', !!h.ride, 'target existed', !!windTarget(sc));
const r=h.ride; if (r) {
let shadows=[]; const oe=ctx.ellipse.bind(ctx); let lastRx=null; ctx.ellipse=function(x,y,rx,ry,...a){ if (Math.abs(x-(r.x1+2))<1 && Math.abs(y-(r.y1+UNIT*0.45))<1) lastRx=rx; return oe(x,y,rx,ry,...a); };
for (let k=0;k<200 && h.ride;k++){ lastRx=null; update(1/60); draw(); const p=Math.min(1,r.t/r.dur); if (k%10===0) shadows.push((p).toFixed(2)+':'+(lastRx==null?'none':(lastRx/(UNIT*0.55)).toFixed(2))); }
ctx.ellipse=oe;
console.log('landing shadow (ride progress:size vs full):', shadows.join('  '));
console.log('landed on the ledge', Math.hypot(h.x-r.x1,h.y-r.y1)<UNIT*0.5, 'fell', h.falling>0); }
console.log('errs', errs2);
`);