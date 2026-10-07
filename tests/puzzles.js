global.location = { search: '?puzzle' };
const src = require('./harness.js').drawn;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin();
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
run(60);
console.log('mode', PUZZLE, 'start scene', state.scene, 'portals', WORLD.puzzlehub.feat.portals.length, 'pip along', pipWithYou());
const cheats = { thicket: ()=>{ rtFor('start').flags.thicket=true; }, gate: ()=>{ breakBarrier('crack1','rock'); }, ring: ()=>{ breakBarrier('crack2','rock'); }, sword: ()=>{ state.inv.sword=true; },
  gusts: ()=>{ enterScene('f4'); }, strong: ()=>{ enterScene('f6'); }, ford: ()=>{ state.hero.y=H*0.05; }, rapids: ()=>{ state.rapids.dist=RAPIDS.len; state.rapids.planks=3; }, reeds: ()=>{ rtFor('m3').flags.reeds=true; }, crags: ()=>{ enterScene('peak3'); }, webs: ()=>{ rtFor('h2').flags.webs=true; } };
for (const q of WORLD.puzzlehub.feat.portals) {
  if (state.scene!=='puzzlehub') { enterScene('puzzlehub'); run(5); }
  const h=state.hero; h.x=q.fx*W; h.y=q.fy*H+UNIT*1.1; run(3);
  const hint=state.actionHint && state.actionHint.verb; press('f'); run(60*6);
  const p=PUZZLES.find(o=>o.id===q.pid);
  const inScene=state.scene, foes=state.enemies.filter(e=>!e.dead).length, rt=RT[p.scene];
  cheats[q.pid](); run(60*2); const solved=state.puzzle && state.puzzle.solved; const title=(state.title && state.title.sub) || 'Q:'+JSON.stringify((state.titleQ||[]).map(t=>t.text))+' speaking '+speakingNow()+' texts '+JSON.stringify(state.texts.map(t=>t.key));
  run(60*4);
  console.log(q.pid.padEnd(8), 'hint', hint, '| entered', inScene, '| foes', foes, '| solved', solved, '|', title, '| back at', state.scene);
}
console.log('records', JSON.stringify(puzzleRecords()));
// retry from the System tab resets the puzzle
enterPuzzle(PUZZLES[0]); run(60*2); rtFor('start').flags.thicket=true; state.puzzle.solved=true; enterPuzzle(PUZZLES[0]); run(60*2); console.log('retry resets brambles', !broken('start','thicket'));
console.log('errs', errs2);
`);