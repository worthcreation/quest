const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message,String(e.stack).split('\\n').slice(1,3).join(' | '));} }};
run(5); state.intro=null; state.texts=[]; const h=state.hero; state.pip=null; enterScene('meadow'); run(3);
state.climbReturn='meadow'; enterScene('climb1'); run(10); const c=state.climb;
console.log('1 the climb: start', c.x.toFixed(1), c.z.toFixed(1), '| on the right slope', climbSide(c.x,c.z)>0);
// 2. walking into the chasm drops you back to your last safe spot
const cz=c.z; c.gust.phase='calm'; c.gust.t=99; state.keys.arrowleft=true; let fell=false; for(let k=0;k<120;k++){ run(1); if(c.fall>0) fell=true; } state.keys.arrowleft=false; run(80);
console.log('2 walk into the chasm: fell', fell, '| back on solid ground', !overChasm(c.x,c.z) && c.fall===0);
// 3. a running jump where it's narrow gets you across
let best=null; for (let z=6; z<30; z+=0.1) { const w=climbHw(z); if (!best || w<best[1]) best=[z,w]; }
c.z=best[0]; c.x=climbCx(best[0])+best[1]+0.3; c.vx=c.vz=0; c.h=0; c.air=false; run(2); state.keys.arrowleft=true; run(8); state.keys[' ']=true; run(2); state.keys[' ']=false; for(let k=0;k<60 && c.air;k++) run(1); run(10); state.keys.arrowleft=false;
console.log('3 narrowest gap', (best[1]*2).toFixed(1), 'wide at z', best[0].toFixed(1), '| jumped across:', climbSide(c.x,c.z)<0 && c.fall===0);
// 4. a gust shoves you back and sideways
c.z=12; c.x=climbCx(12)-climbHw(12)-2; c.vx=c.vz=0; c.fall=0; const z0=c.z, x0=c.x; c.gust.phase='blow'; c.gust.t=1.5; c.gust.dir=1; run(60);
console.log('4 a gust: pushed back', (c.z-z0).toFixed(2), '| sideways', (c.x-x0).toFixed(2));
// 5. reach the flag: back where you came from
c.gust.phase='calm'; c.gust.t=99; c.z=CLIMB.goalZ+0.3; c.x=climbCx(c.z)-climbHw(c.z)-1.5; c.fall=0; state.keys.arrowdown=true; run(30); state.keys.arrowdown=false; run(60*3);
console.log('5 made it:', c.done || !state.climb, '| back in', state.scene);
console.log('BUILD', BUILD, '| errs', errs);
`);
