const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message, String(e.stack).slice(0,300));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
run(10); for(let i=0;i<6 && state.intro && !state.intro.gone;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
inv.story=STORY.gather; ['tent'].forEach(k=>rtFor('camp').flags['built_'+k]=true);
const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip') said.push(state.scene+': '+t); return _s(t,x,y,o); };
// 1. the fields: at most two tufts on the first, none lying on the second
console.log('1 fluff lying about: f1', WORLD.f1.initItems.filter(i=>i.type==='fluff').length, '| f2', (WORLD.f2.initItems||[]).filter(i=>i.type==='fluff').length, '| sticks on the glade', WORLD.start.initItems.filter(i=>i.type==='stick').length, '| craft slots at the start', newInv().craftSlots);
// 2. the wind moves fluff, and can take it off the screen
enterScene('f1'); state.enemies=[]; h.x=W*0.5; h.y=H*0.9; run(2); const tufts=state.items.filter(i=>i.type==='fluff'), start0=tufts.map(t=>[t.x,t.y]); for(let k=0;k<60*60;k++) run(1);
const moved=tufts.map((t,i)=>state.items.includes(t)? (Math.hypot(t.x-start0[i][0],t.y-start0[i][1])/UNIT).toFixed(1)+' tiles':'blown away');
console.log('2 after 60 s of wind on f1:', moved.join(', '));
// 3. no blade and short of fluff: Pip says make a wooden sword first
rawOf().stick=3; state.pipTalkT=-99; enterScene('f2'); for(let k=0;k<60*14;k++){ run(1); if(k%30===0) clear(); } console.log('3 Pip:', said.filter(s=>/sword/.test(s)).slice(0,2).join(' / '));
// 4. a rabbit dies: fluff, every time, while camp is short of it
let got=0; for(let k=0;k<20;k++){ const e={type:'rabbit'}; if(dropFor(e)==='fluff') got++; } console.log('4 rabbit drops while you still need fluff:', got+'/20');
rawOf().fluff=5; let got2=0; for(let k=0;k<200;k++){ if(dropFor({type:'rabbit'})==='fluff') got2++; } console.log('   once you have enough, it goes back to chance:', Math.round(got2/2)+'%');
console.log('BUILD', BUILD, '| errs', errs);
`);
