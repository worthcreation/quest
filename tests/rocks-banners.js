const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }};
run(5); state.intro=null; state.texts=[];
// 1. a thrown rock on soft ground buries itself now and then
enterScene('start'); state.enemies=[]; let buried=0, lay=0; const h=state.hero;
for(let k=0;k<200;k++){ const x=W*(0.3+0.4*Math.random()), y=H*(0.3+0.4*Math.random()); if(!earthen(x,y)) continue; const n0=sceneDef().pullables.filter(p=>p.mud).length, i0=state.items.filter(i=>i.type==='bigrock').length;
  state.shots.push({kind:'rock', x, y, z:UNIT*0.05, vz:-UNIT*2, g:UNIT*30, vx:0, vy:0, spin:0, hit:new Set(), force:1}); run(3);
  if (sceneDef().pullables.filter(p=>p.mud).length>n0) buried++; else if (state.items.filter(i=>i.type==='bigrock').length>i0) lay++; }
console.log('1 rocks landing on the glade: buried', buried, '| lay where they fell', lay, '| buried share', Math.round(buried/Math.max(1,buried+lay)*100)+'%', '| cave floor earthen?', earthen(W/2,H/2,{area:'cave'}));
// 2. breakable stones are bigger than a thrown rock
const ks=Object.values(WORLD).flatMap(s=>s.solids.filter(o=>o.kind==='cracked')); console.log('2 breakable stone sizes (tiles):', [...new Set(ks.map(o=>o.r))].join(', '), '| thrown rock 0.6');
// 3. one banner style
state.title=null; state.scrolls=[]; showTitle('Old Wick\\'s fishing rod','stand by a ripple','relic',3.5); console.log('3 an item alert (build 103): banner?', !!state.title, '| scroll?', (state.scrolls||[]).length===1); state.title=null; state.texts=[]; state.inv.quests={}; state.questT=-9; state.inv.story=STORY.garden; updateQuests(); for(let k=0;k<30;k++){ update(1/60); } console.log('   a quest starting still gets the banner:', (state.title&&state.title.style)||'-', (state.title&&state.title.text)||'');
console.log('BUILD', BUILD, '| errs', errs);
`);
