const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
run(5); state.intro=null; state.texts=[]; enterScene('start'); state.enemies=[]; run(5); const inv=state.inv, h=state.hero, sl=()=>JSON.stringify(Object.fromEntries(ALL_SLOTS.map(k=>[k, slotsOf()[k]?slotsOf()[k].id:null])));
const give=t=>{ collect({type:t,x:h.x,y:h.y}); run(20); };
give('turnipseed'); give('turnip'); give('acorn'); inv.woodsword=WOOD_SWORD; run(20);
console.log('1 lanes: seeds, food, acorns, blade ->', sl());
give('carrot'); give('carrotseed'); console.log('2 a second food and a second seed stay in the pack (their keys are taken):', sl());
state.texts=[]; h.vig=2; const t0=inv.food.filter(f=>f==='turnip').length; press('s'); console.log('3 tap S eats the turnip:', inv.food.filter(f=>f==='turnip').length===t0-1);
inv.food.push('turnip'); run(20);
// 4. R is the only swap: it opens on the key you last used (S here), A S D F switch the key, each lists only what fits
state.keys.r=true; run(3); const R0=state.radial; console.log('4 press R after using S: wheel for', R0&&R0.slot, '->', R0&&R0.opts.map(o=>o.id).join(','));
state.keys.s=false; state.keys.f=true; run(2); state.keys.f=false; run(2); console.log('   F while R is held: wheel for', state.radial&&state.radial.slot, '->', state.radial&&state.radial.opts.map(o=>o.id).join(','), '| swung?', !!state.atk);
state.keys.a=true; run(2); state.keys.a=false; run(2); const RA=state.radial; RA.sel=RA.opts.findIndex(o=>o.id==='carrot'); state.keys.r=false; run(3);
console.log('   A, point at carrot, let go of R: A =', slotsOf().a&&slotsOf().a.id, '| wheel closed', !state.radial);
state.keys.s=true; run(30); console.log('5 holding S no longer opens a wheel:', !state.radial); state.keys.s=false; run(3);
console.log('BUILD', BUILD, '| errs', errs);
`);
