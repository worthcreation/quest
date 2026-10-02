const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\n').slice(1,3).join(' | '));} }};
run(5); state.intro=null; state.texts=[]; state.pip=null; enterScene('meadow'); run(3); state.climbReturn='meadow';
// (1. the wind trail, climb1, was remade as the wind shelf, mt1, in build 207: tests/windshelf.js)
// (2. the stepping stones, climb2, was remade as the stepping path, mt2, in build 211: tests/stepping-path.js)
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
let c=state.climb; let t=0; state.keys.arrowright=true; while(state.scene==='climb5' && t<60*120){ state.hero.vig=maxVig(); if(!c.air && t%50===0){ state.keys[' ']=true; run(2); state.keys[' ']=false; } run(1); t++; } state.keys.arrowright=false;
console.log('5 side view: after', (t/60).toFixed(1), 's ->', state.scene);
// 6. the join (build 203): out of climb5 you stand on peak1; peak1's west way leads back onto climb5, at its foot
for(let k=0;k<80 && state.busy;k++) run(1); run(5); const onPeak=state.scene==='peak1' && !state.climb, at=[state.hero.x/W, state.hero.y/H];
const wx=WORLD.peak1.exits.find(e=>e.side==='w'); state.hero.x=UNIT*0.6; state.hero.y=(wx.a+wx.b)/2*H; state.hero.vx=state.hero.vy=0; state.keys.arrowleft=true; run(40); state.keys.arrowleft=false; for(let k=0;k<80 && state.busy;k++) run(1); run(5);
const back=state.scene, c5=state.climb; console.log('6 the join: on peak1 after the ledges', onPeak, 'at', at.map(v=>v.toFixed(2)).join(','), '| peak1 west ->', back, '| climb running', !!c5, 'at ledge', c5&&c5.kind==='side' ? c5.px.toFixed(2)+','+c5.py.toFixed(2) : '-');
if (!(onPeak && back==='climb5' && c5 && c5.kind==='side')) errs++;
console.log('BUILD', BUILD, '| errs', errs);
`);
