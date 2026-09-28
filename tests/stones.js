const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }};
run(5); state.intro=null; state.texts=[]; const inv=state.inv, h=state.hero; inv.story=STORY.adventure;
// 1. the boulder barrier holds: walk hard at it from every height of the opening
let through=0; for (const id of ['w1','w2']) { enterScene(id); state.enemies=[]; state.pip=null; run(3); const bar=sceneDef().solids.filter(s=>s.kind==='crag' && (s.bar==='crack1'||s.bar==='crack2')); const ys=bar.map(s=>s.fy*H), y0=Math.min(...ys), y1=Math.max(...ys);
  for (let t=0;t<=6;t++){ enterScene(id); state.enemies=[]; run(2); h.x=W*0.85; h.y=y0+(y1-y0)*t/6; state.keys.arrowright=true; for(let k=0;k<120 && state.scene===id;k++) run(1); state.keys.arrowright=false; if(state.scene!==id) { through++; console.log('   got through', id, 'into', state.scene, 't', t, 'y', (h.y/UNIT).toFixed(1), 'bar y', (y0/UNIT).toFixed(1), '-', (y1/UNIT).toFixed(1), 'exit', JSON.stringify(sceneDef().exits.filter(e=>e.side==='e'))); } } }
console.log('1 walks that got past an unbroken boulder barrier:', through, 'of 14');
// 2. gremlins slip between the boulders
enterScene('w3'); run(2); const g=makeEnemy('gremlin', W*0.9, H*0.5, 0); const wb=state.solids.find(s=>s.bar==='cave') || state.solids.find(s=>s.kind==='crag'); g.x=wb.x; g.y=wb.y; const x0=g.x; collideSolids(g, g.r*0.85); console.log('2 a gremlin squeezes past the cave stone (not pushed out):', Math.abs(g.x-x0)<=1);
// 3. the stones: breakable ones are big, barriers bigger still
const cr=Object.values(WORLD).flatMap(s=>s.solids.filter(o=>o.kind==='crag').map(o=>o.size)), wd=Object.values(WORLD).flatMap(s=>s.solids.filter(o=>o.kind==='wedge'||o.kind==='cracked'));
console.log('3 boulder sizes (tiles):', [...new Set(cr)].sort().join(', '), '| rings, rows or keystones left:', wd.length, '| thrown rock 0.6');
// 4. the lantern in the tent
inv.lantern=false; state.dusk=false; enterScene('tentin'); run(3); const [lx,ly]=lanternSpot(); h.x=lx; h.y=ly+UNIT*0.6; run(3); state.texts=[]; state.keys.f=true; run(2); state.keys.f=false; run(3); const tookDay=!!inv.lantern;
state.dusk=true; run(3); state.texts=[]; draw(); const hint=(state.hintActs||[]).map(a=>a.verb).join(','); state.keys.f=true; run(2); state.keys.f=false; run(3);
console.log('4 lantern by day: taken?', tookDay, '| at twilight: hint', hint, '| taken', !!inv.lantern);
console.log('BUILD', BUILD, '| errs', errs);
`);
