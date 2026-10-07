global.location = { search: '?arena' };
const src = require('./harness.js').drawn;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin();
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
run(60);
console.log('arena world is the real world:', ['start','c4','sw2','f4','riverbank'].every(id=>WORLD[id]), '| extra screens:', Object.keys(WORLD).filter(k=>!buildWorld(SEED)[k]).join(','));
for (const q of WORLD.arena.feat.portals) {
  if (state.scene!=='arena') { enterScene('arena'); run(5); }
  const h=state.hero; h.x=q.fx*W; h.y=q.fy*H+UNIT*1.2; run(3); const hint=state.actionHint && state.actionHint.verb; press('f'); run(60*2);
  const z=ARENA_ZONES[q.pid.slice(5)]; const types=new Set();
  let waves=0; for (let w=0; w<5; w++){ run(60*3.2); state.enemies.filter(e=>!e.dead).forEach(e=>types.add(e.type)); run(60); state.hero.vig=maxVig(); state.hero.invuln=2; for (const e of state.enemies) if(!e.dead){ e.hp=0; kill(e); } run(30); waves=state.arena? state.arena.wave : 5; }
  run(60*5);
  console.log(z.name.padEnd(14), 'hint', hint, '| real screen', z.scene, '| waves done', waves, '| saw', [...types].join('+'), '| back at', state.scene);
}
console.log('records', JSON.stringify(puzzleRecords()));
console.log('errs', errs2);
`);