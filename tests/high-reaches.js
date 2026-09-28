const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<5) console.log('ERR',state.scene,e.message,String(e.stack).split('\\n').slice(1,3).join(' | '));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<20 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
run(5); state.intro=null; state.texts=[]; const inv=state.inv, h=state.hero; inv.story=STORY.adventure; inv.tortoise=true; inv.sword=true; state.pip=null;
// 1. the way up and the new screens
console.log('1 summit exits:', WORLD.peak3.exits.map(e=>e.side+'->'+e.to).join(', '), '| new screens:', ['hr1','hr2','hr3'].filter(id=>WORLD[id]).join(', '));
const pos=Object.entries(MAP_LAYOUT).map(([k,v])=>v.join(',')); console.log('   map places unique:', new Set(pos).size===pos.length);
for (const id of ['hr1','hr2','hr3']) { enterScene(id); run(60); const sc=sceneDef(); console.log('  ', id, '|', sc.msg, '| statues', sc.solids.filter(s=>s.kind==='crystalbug').length, '| critters', state.enemies.map(e=>e.type).join(',')||'-', '| view', sc.vista, '| npcs', sc.npcs.map(n=>n.kind).join(',')||'-'); }
console.log('   title card on first arrival above the clouds:', !!state.highTitle || inv.sawHighTitle);
// 2. the beetle joins
enterScene('hr2'); state.enemies=[]; run(5); const b=WORLD.hr2.feat.beetle; h.x=b[0]*W; h.y=b[1]*H+UNIT*0.8; run(3); press('f'); run(3); clear(); console.log('2 beetle along:', !!inv.beetle);
h.vig=1; inv.food=['turnip']; run(10); console.log('   low vigor with a turnip in the pack: beetle fed you', inv.food.length===0);
const v0=h.vig; enterScene('hr1'); state.enemies=[]; h.vig=2; const vv=h.vig; run(60*3); console.log('   out in the wind near crystal: vigor', vv, '->', h.vig.toFixed(2));
// 3. slower rest
inv.beetle=null; enterScene('start'); state.enemies=[]; h.vig=2; h.rest=-9; run(60*5); console.log('3 five seconds of rest (no beetle, no food): vigor 2 ->', h.vig.toFixed(2), 'of', maxVig());
// 4. a hawk grabs and drops
inv.beetle={t:0}; enterScene('hr1'); state.enemies=[]; run(3); h.x=W*0.6; h.y=H*0.5; const hk=makeEnemy('hawk', h.x, h.y-UNIT*3, 0); state.enemies=[hk]; hk.mode='dive'; hk.t=0.01; hk.tx=h.x; hk.ty=h.y; hk.x0=h.x; hk.y0=h.y-UNIT*3; h.invuln=0;
const _r=Math.random; Math.random=()=>0.1; run(2); Math.random=_r; const grabbed=!!state.grab; for(let k=0;k<120;k++) run(1); console.log('4 hawk dive -> grabbed', grabbed, '| let go', !state.grab, '| scene now', state.scene);
// 5. the worm talks
enterScene('hr3'); state.highTitle=null; state.enemies=[]; run(3); const wn=WORLD.hr3.npcs[0]; h.x=wn.fx*W; h.y=wn.fy*H+UNIT*1.2; run(3); press('f'); run(3); console.log('5 the worm:', (state.npcTalk&&state.npcTalk.lines||[]).slice(0,2).join(' / ').slice(0,160));
console.log('BUILD', BUILD, '| errs', errs);
`);
