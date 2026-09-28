const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\n').slice(1,3).join(' | '));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
run(5); state.intro=null; state.texts=[]; const inv=state.inv, h=state.hero; inv.story=STORY.adventure; inv.pipSaved=true; state.pip=null;
// 1. the Map tab appears once a mushroom is found, and lists them with costs
console.log('1 Map tab before any mushroom:', tabShown('Map'));
inv.shrooms={camp:true, w2:true, foot:true}; inv.spores=6; enterScene('camp'); run(5);
console.log('   after three:', tabShown('Map'), '|', sporeCells().map(c=>c.name+(c.mark?' (here)':' '+c.count)).join(', '));
// 2. F at the camp mushroom opens it; travel from there
const f=WORLD.camp.feat.shroom; h.x=f[0]*W; h.y=f[1]*H+UNIT*1.2; run(3); state.texts=[]; press('f'); console.log('2 F at a mushroom opens:', state.menu&&PACK_TABS[state.menu.tab]);
const i=sporeCells().findIndex(c=>c.name===SHROOM_NAMES.w2); state.menu.sel=i; state.menu.focus='grid'; press('f'); press('f'); for(let k=0;k<120 && state.scene==='camp';k++) run(1); console.log('   travelled to', state.scene, '| spores left', inv.spores);
// 3. each traveler's mushroom looks different
console.log('3 looks:', Object.entries(SHROOM_LOOKS).map(([k,v])=>k+':'+v.cap+'/'+v.mark).join(' '));
// 4. little mushrooms, and Wick's cellar
console.log('4 little mushroom clusters: woods', WORLD.w1.feat.minis.length, '| caves', WORLD.c1.feat.minis.length, '| glade', (WORLD.start.feat.minis||[]).length, '| fields', (WORLD.f1.feat.minis||[]).length, '| cellar', WORLD.cellar.feat.minis.length);
enterScene('shack'); run(3); const td=WORLD.shack.feat.trapdoor; h.x=td[0]*W; h.y=td[1]*H+UNIT*0.6; run(3); state.texts=[]; press('f'); for(let k=0;k<60;k++) run(1); console.log('   through the trapdoor ->', state.scene, '| dark', !!sceneDef().dim);
console.log('BUILD', BUILD, '| errs', errs);
`);
