const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\n').slice(1,3).join(' | '));} }};
run(5); state.intro=null; state.texts=[]; state.pip=null; enterScene('meadow'); run(3); state.climbReturn='meadow';
// 1. the wind trail: into the chasm and back; a running jump across the narrowest gap; a gust; the flag
enterScene('climb1'); run(10); let c=state.climb, d=climbDef();
c.gust.t=99; state.keys.arrowleft=true; let fell=false; for(let k=0;k<120;k++){ run(1); if(c.fall>0) fell=true; } state.keys.arrowleft=false; run(80);
let best=null; for (let z=6; z<30; z+=0.1) { const w=d.hw(z); if (!best || w<best[1]) best=[z,w]; }
c.z=best[0]; c.x=d.cx(best[0])+best[1]+0.3; c.vx=c.vz=0; run(2); state.keys.arrowleft=true; run(8); state.keys[' ']=true; run(2); state.keys[' ']=false; for(let k=0;k<60 && c.air;k++) run(1); run(10); state.keys.arrowleft=false;
const across=climbSide(c.x,c.z)<0 && c.fall===0;
c.z=12; c.x=d.cx(12)-d.hw(12)-2; c.vx=c.vz=0; c.fall=0; const z0=c.z; c.gust.phase='blow'; c.gust.t=1.5; run(60); const pushed=c.z-z0;
c.gust.phase='calm'; c.gust.t=99; c.z=d.goalZ+0.3; c.x=d.cx(c.z)-d.hw(c.z)-1.5; state.keys.arrowdown=true; run(30); state.keys.arrowdown=false; run(60*2.5);
console.log('1 wind trail: fell into the chasm', fell, '| jumped the narrowest gap', across, '| a gust pushed back', pushed.toFixed(2), '| flag -> next screen', state.scene);
// 1b. the zigzag: going straight down the right-hand ledge, the crags stop you; you have to cross
enterScene('climb1'); run(5); c=state.climb; d=climbDef(); c.gust.t=99; c.z=18; c.x=d.cx(18)+d.hw(18)+1.2; state.keys.arrowdown=true; for(let k=0;k<60*4 && !(c.fall>0);k++) run(1); state.keys.arrowdown=false; run(70);
console.log('1b straight down the right ledge (open ground for testing): reached z', c.z.toFixed(1), '| fell', c.fall>0);
enterScene('climb2'); run(5);
// 2b. the whole stepping path, hopped like a player would (aim, a short run, jump, steer)
{ enterScene('climb2'); run(5); const c2=state.climb, d2=climbDef(); c2.gust.t=999; const path=[]; const targets=d2.islands.map(([ix,iz])=>[d2.cx(iz)+ix, iz]).concat([[d2.cx(5)-d2.hw(5)-1.2, 5.2]]);
  c2.x=d2.cx(17.5)+d2.hw(17.5)+0.5; c2.z=17.5; run(2);
  for (const [tx,tz] of targets) { const dx=tx-c2.x, dz=tz-c2.z, scr=(d2.mirror?-1:1)*Math.sign(dx); state.keys[scr<0?'arrowleft':'arrowright']=Math.abs(dx)>0.2; state.keys[dz<0?'arrowdown':'arrowup']=Math.abs(dz)>0.2; run(3); state.keys[' ']=true; run(2); state.keys[' ']=false;
    for(let k=0;k<60 && c2.air;k++){ const ddx=tx-c2.x, ddz=tz-c2.z, s2=(d2.mirror?-1:1)*Math.sign(ddx); state.keys.arrowleft=s2<0&&Math.abs(ddx)>0.15; state.keys.arrowright=s2>0&&Math.abs(ddx)>0.15; state.keys.arrowdown=ddz<-0.15; state.keys.arrowup=ddz>0.15; run(1); }
    for(const k of ['arrowleft','arrowright','arrowup','arrowdown']) state.keys[k]=false; run(12); path.push(c2.fall>0?'fell':'ok'); if(c2.fall>0) run(70); }
  console.log('2b stepping stones, the whole path:', path.join(' '), '| across:', climbSide(c2.x,c2.z)<-climbHw(c2.z)); }
enterScene('climb2'); run(5);
{ enterScene('climb3'); run(5); const c3=state.climb, d3=climbDef(); c3.gust.t=999; c3.x=1.6; let t=0, falls=0; state.keys.arrowdown=true;
  while(state.scene==='climb3' && t<60*40){ if(!c3.air && d3.gap(c3.x, c3.z-0.5)){ state.keys[' ']=true; run(1); state.keys[' ']=false; } run(1); t++; if(c3.fall>0 && c3.fall<0.03) falls++; } state.keys.arrowdown=false;
  console.log('3 the broken meadow: straight down through the narrow place, jumping each rift: falls', falls, '->', state.scene); }
{ enterScene('climb4'); run(5); const c4=state.climb, d4=climbDef();
  // out on a bare island when the gust blows: off you go
  c4.x=0.4; c4.z=13.7; c4.vx=c4.vz=0; c4.gust.phase='blow'; c4.gust.t=2; c4.gust.dir=1; let blown=false; for(let k=0;k<100;k++){ run(1); if(c4.fall>0) blown=true; } run(80);
  // tucked behind a big rock on the downwind side: you stay put
  const [bx,bz,br]=d4.boulders[3]; c4.x=bx; c4.z=bz+br+0.4; c4.vx=c4.vz=0; c4.fall=0; c4.gust.phase='blow'; c4.gust.t=2; c4.gust.dir=1; const z0=c4.z; run(100); const moved=Math.abs(c4.z-z0);
  // caught in the open near the start: blown all the way back to the screen before
  c4.x=0; c4.z=21.8; c4.vx=c4.vz=0; c4.gust.phase='blow'; c4.gust.t=3; for(let k=0;k<200 && state.scene==='climb4';k++) run(1);
  console.log('4 the windy crossing: caught on a bare island -> blown off', blown, '| behind a big rock -> moved', moved.toFixed(2), 'tiles | caught in the open near the start -> now on', state.scene); }
enterScene('climb5'); run(5);
for (const id of []) { enterScene(id); run(10); c=state.climb; d=climbDef(); c.gust.t=99; c.z=d.goalZ+0.3; c.x=d.cx(c.z)-d.hw(c.z)-1.5; state.keys.arrowdown=true; run(30); state.keys.arrowdown=false; run(60*2.5); console.log('3 '+d.name+': start ok, flag -> ', state.scene); }
// 5. the side view: run right and jump now and then; reach the top, out into the crags
c=state.climb; let t=0; state.keys.arrowright=true; while(state.scene==='climb5' && t<60*120){ state.hero.vig=maxVig(); if(!c.air && t%50===0){ state.keys[' ']=true; run(2); state.keys[' ']=false; } run(1); t++; } state.keys.arrowright=false;
console.log('5 side view: after', (t/60).toFixed(1), 's ->', state.scene);
console.log('BUILD', BUILD, '| errs', errs);
`);
