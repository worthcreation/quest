const src = require('./harness.js').drawn;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message, String(e.stack).slice(0,200));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<20 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
run(5); state.intro=null; state.texts=[]; const inv=state.inv, h=state.hero; inv.story=STORY.adventure; state.dusk=true;
// 1. the sword scene: nothing in your hand while the old sword comes up
inv.woodsword=WOOD_SWORD; run(10); enterScene('w3'); state.enemies=[]; run(5); startSwordCut(); run(30); console.log('1 during the stump scene: dusk still', state.dusk, '| wooden sword hidden', !!(state.cut&&state.cut.type==='sword'&&!inv.sword));
for(let k=0;k<60*6 && state.cut;k++) run(1); console.log('   after: sword', inv.sword, '| still twilight', state.dusk);
// 2. the homecoming
enterScene('c7'); state.enemies=[]; run(5); state.pip={x:h.x+UNIT,y:h.y,show:true,follow:true}; const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&(o.key==='pip'||o.who==='pip'||o.key==='npc')) said.push(t); return _s(t,x,y,o); };
startRescue(); let maxTint=0, sporeFx=0, scenes=[state.scene]; for(let k=0;k<60*14 && state.cut;k++){ run(1); if(k%25===0) clear(); maxTint=Math.max(maxTint, state.sporeTint||0); sporeFx=Math.max(sporeFx, state.fx.filter(f=>/c9a2ff|b48af0|e8d0ff|8f6ad8/.test(f.color)).length); if(scenes[scenes.length-1]!==state.scene) scenes.push(state.scene); }
console.log('2 spore travel: spores in the air at most', sporeFx, '| violet tint up to', maxTint.toFixed(2), '| scenes', scenes.join(' > '));
console.log('   Pip:\\n     '+said.join('\\n     '));
console.log('   the journal quest has begun:', state.inv.journal===1, '| torn pages out', Object.values(RT).some(r=>r.items&&r.items.some(i=>i.type==='page')) || state.items.some(i=>i.type==='page'));
console.log('   morning: dusk', state.dusk, '| dawn glow', !!state.dawn, '| rested', h.vig===maxVig(), '| scroll', (state.scrolls||[]).map(s=>s.title+': '+s.text).join(''));
// 3. marsh fire in S: holding S breathes, no wheel
inv.fire=true; enterScene('m1'); state.enemies=[]; run(10); setSlot('s',{kind:'ability',id:'fire'}); state.keys.s=true; run(40); const breathing=state.fireHold.on, wheel=!!state.radial; state.keys.s=false; run(5);
console.log('3 hold S with marsh fire: breathing', breathing, '| wheel opened', wheel, '| spark on release', !!state.spark);
console.log('BUILD', BUILD, '| errs', errs);
`);
