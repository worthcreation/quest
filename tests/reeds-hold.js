const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=(n,dt)=>{for(let k=0;k<n;k++){ try{update(dt);}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }};
run(5,1/60); state.intro=null; state.pip=null;
// Build 205: the reeds hold. Run at them from every spot along the wall (never starting inside a stone), walking,
// dashing, a dash at lunge-chain speed and charged lunges, on a slow frame (dt 0.05, the loop's cap) and at 60 fps,
// on a laptop and a phone screen. Nobody ends up east of the reeds.
const out=[];
for (const [w,hh,dt] of [[1280,800,1/60],[1280,800,0.05],[390,844,0.05]]) { window.innerWidth=w; window.innerHeight=hh; resize();
  startTestScene('rise'); state.pip=null; state.enemies=[]; state.inv.sword=true; state.inv.step=3; let through=0, tries=0;
  const hw=mtnHalf(RISE, RISE.barX), h=state.hero;
  for (let y=RISE.mid-hw+0.3; y<=RISE.mid+hw-0.3; y+=0.4) for (const how of ['walk','dash','dash3','lunge']) for (const dy of [-1,0,1]) {
    h.x=(RISE.barX-1.8)*UNIT; h.y=y*UNIT; if (state.solids.some(o=>Math.hypot(o.x-h.x,o.y-h.y)<o.r+UNIT*0.45)) continue; tries++;
    h.vx=h.vy=0; h.fx=1; h.fy=0; h.dashT=0; state.atk=null; h.vig=maxVig(); run(2,dt);
    state.keys.arrowright=true; state.keys[dy<0?'arrowup':'arrowdown']=dy!==0; run(Math.round(0.13/dt),dt);
    for (let k=0;k<4;k++){ const f=Math.round(0.25/dt);
      if (how==='dash'){ h.dashT=0.22; h.vx=h.fx*1.2*L(); h.vy=h.fy*1.2*L(); run(f,dt); }
      else if (how==='dash3'){ h.dashT=0.27; h.vx=h.fx*1.9*L(); h.vy=h.fy*1.9*L(); run(f,dt); }
      else if (how==='lunge'){ state.keys.f=true; run(Math.round(0.6/dt),dt); state.keys.f=false; run(f,dt); }
      else run(f,dt); h.vig=maxVig(); }
    state.keys.arrowright=state.keys.arrowup=state.keys.arrowdown=false; run(Math.round(0.3/dt),dt);
    if (h.x/UNIT > RISE.barX+0.3) through++; }
  out.push(w+'x'+hh+' dt '+dt.toFixed(3)+': '+through+' of '+tries+' through'); if (through) errs++; }
window.innerWidth=1280; window.innerHeight=800; resize();
console.log('the reeds hold |', out.join(' | '));
console.log('BUILD', BUILD, '| errs', errs);
`);
