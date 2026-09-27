const src = require('./harness.js').src;
eval(src+`;
begin();
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,400)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip') said.push(t); return _s(t,x,y,o); };
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
inv.acorns=4; h.x=W*0.5; h.y=H-UNIT*0.6; run(2); state.keys.arrowdown=true; run(90); state.keys.arrowdown=false; for(let k=0;k<60*10;k++) run(1);
console.log('1 in the meadow, Pip first says:', said[0]);
console.log('2 compost talk during the garden quest (carrying acorns):', said.some(t=>/compost/i.test(t)));
// 3. tips at a patch
const q=WORLD.meadow.feat.plots[WORLD.meadow.feat.plots.length-1]; const tips=()=>{ h.x=q[0]*W; h.y=q[1]*H; run(3); draw(); return (state.actionHint? (state.hintActs||[]).map(a=>a.key+' '+a.verb).join(' | ') : '(none)'); };
inv.bag.turnipseed=0; inv.acorns=0; run(20); console.log('3 patch, nothing in hand:', tips());
inv.bag.turnipseed=2; run(20); console.log('   seeds only:', tips());
inv.acorns=3; run(20); console.log('   seeds and 3 acorns:', tips());
inv.bag.turnipseed=0; run(20); console.log('   acorns only:', tips());
inv.bag.turnipseed=2; run(20); const rt=rtFor('meadow'), i=WORLD.meadow.feat.plots.length-1; const lv0=((rt.flags.plots||[])[i]||{}).lv||0; h.x=q[0]*W; h.y=q[1]*H; run(3); clear(); press('f'); run(3);
console.log('4 F there composts:', (((rt.flags.plots||[])[i]||{}).lv||0) === lv0+1, '| acorns left', inv.acorns, '| still empty for planting', !((rt.flags.plots||[])[i]||{}).s);
// 5. a buried rock not yet loosened: only the pound
enterScene('start'); run(5); clear(); const pl=WORLD.start.pullables.find(p=>p.kind==='rock'); if(pl){ h.x=pl.fx*W-UNIT; h.y=pl.fy*H; run(3); draw(); console.log('5 buried rock:', (state.hintActs||[]).map(a=>a.key+' '+a.verb).join(' | ')); }
// 6. wandering about: Pip never pops in from nowhere
inv.story=STORY.gather; state.pip=null; run(5); let pops=0, maxStep=0, ps=state.scene, lastP=null, scenes=0; const _pl=placePipNearHero; placePipNearHero=function(){ if(state.scene===ps) pops++; return _pl(); };
for(let k=0;k<60*40;k++){ const t=(k/60); state.keys.arrowright=Math.sin(t*0.7)>0.3; state.keys.arrowleft=Math.sin(t*0.7)<-0.3; state.keys.arrowdown=Math.sin(t*1.1)>0.4; state.keys.arrowup=Math.sin(t*1.1)<-0.4; ps=state.scene; run(1); if(state.scene!==ps){ scenes++; lastP=null; continue; } const p=state.pip; if(p&&p.show){ if(lastP) maxStep=Math.max(maxStep, Math.hypot(p.x-lastP[0],p.y-lastP[1])/UNIT); lastP=[p.x,p.y]; } }
['arrowright','arrowleft','arrowdown','arrowup'].forEach(k=>state.keys[k]=false);
console.log('6 40 s of wandering ('+scenes+' screen changes): Pip popped in on the same screen', pops, 'times | biggest single-frame move', maxStep.toFixed(2), 'tiles');
console.log('BUILD', BUILD, '| errs', errs);
`);
