const src = require('./harness.js').src;
eval(src+`;
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
begin(); state.cut=null; enterScene('meadow'); state.cut=null;
const h=state.hero, inv=state.inv; run(3);
state.solids=[]; state.items=[]; state.enemies=[];
// a rabbit that keeps darting across the line of fire: each trial it starts 5 tiles ahead, offset a little, moving sideways
function trial(lvl){
  setSkillLevel('acorn', lvl); const s=skillOf('acorn'); s.lvl=lvl;   // hold the level: reset counters so practice during the trial cannot raise it
  let hits=0, N=150;                                               // (150 throws a level: the gap between levels stays clear, at half the time)
  for(let i=0;i<N;i++){
    state.enemies=[]; state.shots=[]; state.texts=[];
    h.x=W*0.3; h.y=H*0.5; h.fx=1; h.fy=0; h.vx=h.vy=0; h.vig=maxVig(); h.z=0;
    const e=makeEnemy('rabbit', h.x+UNIT*5, h.y+(Math.random()*2-1)*UNIT*1.5, -1);
    e.hp=99; e.mode='idle'; e.t=9; e.cool=9;                       // stays in idle: wanders at random, no dart at the hero
    e.vx=0; e.vy=(Math.random()<0.5?-1:1)*0.35*L();                 // crossing the line of fire
    state.enemies.push(e);
    inv.acorns=30; state.equip='acorn';
    const hit0=s.hits;
    launch('acorn', 0.6);
    for(let k=0;k<60;k++) update(1/60);                               // (flight only: nothing here needs drawing)
    if(s.hits>hit0) hits++;
    s.hits=hit0; s.n=0; s.lvl=lvl;                                  // hold the level
  }
  return hits/N;
}
inv.silk=0;
ACORN_HOME.push(0); ACORN_SPREAD.push(0); const base=trial(5); ACORN_HOME.pop(); ACORN_SPREAD.pop(); console.log('no spread, no homing (build 61 behaviour):', (base*100).toFixed(0)+'%'); const rates=[0,1,2,3,4].map(trial); console.log('by level 0..4:', rates.map(r=>(r*100).toFixed(0)+'%').join(' ')); const r0=rates[0], r3=rates[3];
console.log('hit rate vs crossing rabbit, 150 throws each: level 0', (r0*100).toFixed(0)+'%', '| level 3', (r3*100).toFixed(0)+'%', '| better', r3>r0+0.1);
// homing only inside the cone: a rabbit off to the side is ignored
setSkillLevel('acorn',3); state.enemies=[]; state.shots=[]; h.x=W*0.3; h.y=H*0.5; h.fx=1; h.fy=0;
const side=makeEnemy('rabbit', h.x+UNIT*1, h.y-UNIT*4, -1); side.mode='idle'; side.t=9; side.cool=9; side.hp=99; state.enemies.push(side);
launch('acorn',0.6); const sh=state.shots[0]; const a0=Math.atan2(sh.vy,sh.vx); run(5); const a1=Math.atan2(sh.vy,sh.vx);
console.log('rabbit outside the cone: acorn turned', Math.abs(a1-a0).toFixed(3), 'rad (spread only)');
// level-up: the line fires once, in the skill colour, and only when the step is crossed
setSkillLevel('acorn',0); state.texts=[]; state.enemies=[]; state.shots=[]; const sk=skillOf('acorn');
for(let i=0;i<11;i++){ inv.acorns=30; launch('acorn',0.3); run(3); }
const early=state.texts.filter(t=>t.color===SKILL_COLOR).length;
inv.acorns=30; launch('acorn',0.3); run(3);
const up=state.texts.filter(t=>t.color===SKILL_COLOR);
for(let i=0;i<5;i++){ inv.acorns=30; launch('acorn',0.3); run(3); }
const later=state.texts.filter(t=>t.color===SKILL_COLOR);
console.log('after 11 throws: lines', early, '| 12th throw: level', sk.lvl, 'lines', up.length, JSON.stringify(up.map(t=>t.text)), '| 5 more throws: still', later.length, 'line');
// hits count double: 18 hits alone reach level 2 (36)
setSkillLevel('acorn',0); state.texts=[]; for(let i=0;i<18;i++) skillUse('acorn',true); console.log('18 hits: level', skillOf('acorn').lvl, '| text', JSON.stringify(state.texts.filter(t=>t.color===SKILL_COLOR).map(t=>t.text)));
// old save without a skill field loads and lazily gets one
delete inv.skill; console.log('old inventory: level', skillLevel('acorn'), '| spread deg at 0/4', ACORN_SPREAD[0], ACORN_SPREAD[4]);
// save round trip keeps it
setSkillLevel('acorn',2); saveSlot(0); setSkillLevel('acorn',0); loadSlot(0); console.log('save/load keeps level', skillLevel('acorn'));
console.log('BUILD', BUILD, '| errs', errs);
`);
