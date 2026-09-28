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
// 2. stepping stones: from the bank onto the first island, then the next
c=state.climb; d=climbDef(); const [ix,iz,ir]=d.islands[0]; c.z=iz; c.x=d.cx(iz)+d.hw(iz)+0.3; c.gust.t=99; c.vx=c.vz=0; run(2);
const hop=(tx)=>{ const L=tx<c.x; state.keys[L?(d.mirror?'arrowright':'arrowleft'):(d.mirror?'arrowleft':'arrowright')]=true; run(4); state.keys[' ']=true; run(2); state.keys[' ']=false; state.keys.arrowleft=state.keys.arrowright=false; for(let k=0;k<60 && c.air;k++) run(1); run(10); };
const x0h=c.x; hop(d.cx(iz)+ix); console.log('2 stepping stones: landed on the first island', onClimbIsland(c.x,c.z) && c.fall===0, '| screen', state.scene);
for (const id of ['climb3','climb4']) { enterScene(id); run(10); c=state.climb; d=climbDef(); c.gust.t=99; c.z=d.goalZ+0.3; c.x=d.cx(c.z)-d.hw(c.z)-1.5; state.keys.arrowdown=true; run(30); state.keys.arrowdown=false; run(60*2.5); console.log('3 '+d.name+': start ok, flag -> ', state.scene); }
// 5. the side view: run right and jump now and then; reach the top, out into the crags
c=state.climb; let t=0; state.keys.arrowright=true; while(state.scene==='climb5' && t<60*60){ if(!c.air && t%50===0){ state.keys[' ']=true; run(2); state.keys[' ']=false; } run(1); t++; } state.keys.arrowright=false;
console.log('5 side view: after', (t/60).toFixed(1), 's ->', state.scene);
console.log('BUILD', BUILD, '| errs', errs);
`);
