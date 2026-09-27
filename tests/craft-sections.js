const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++;} }};
run(5); state.intro=null; enterScene('start'); state.items=[]; state.treeCool={}; const trees=state.solids.filter(s=>s.kind==='tree'); const got={}; for(let k=0;k<400;k++){ const t=trees[k%trees.length]; state.treeCool[t.key]=0; state.items=[]; dropAcorn(t); for(const i of state.items) got[i.type]=(got[i.type]||0)+1; }
console.log('1 400 tree shakes dropped:', JSON.stringify(got));
const inv=state.inv; inv.craftSlots=2; console.log('2 craft places: an old save with 2 ->', craftSlots(), '| workbench built ->', (rtFor('camp').flags.built_bench=true, craftSlots()));
console.log('3 Craft sections:', [...new Set(packCells('Craft').map(c=>c.sec))].join(' > '));
console.log('BUILD', BUILD, '| errs', errs);
`);
