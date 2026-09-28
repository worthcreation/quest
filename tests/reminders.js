const src = require('./harness.js').src;
eval(src+`;
begin();
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,400)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
run(10); const introHeld=state.texts.some(t=>t.hold); for(let i=0;i<6 && state.intro && !state.intro.gone;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
console.log('1 the jetty opening waits for F:', introHeld);
// 2. in the meadow, idle with no seeds: reminders, each different, from different spots
enterScene('meadow'); run(10); clear(); { const hp=hollowPoint(); h.x = hp[0] < W/2 ? W*0.9 : W*0.1; h.y = H*0.15; } const said=[], spots=[];
const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip'){ said.push({t, held:o.hold!==false && PIP_HOLD.has('x')}); spots.push([Math.round(state.pip.x/UNIT),Math.round(state.pip.y/UNIT)]); } return _s(t,x,y,o); };
for(let k=0;k<60*120;k++) run(1);
const rem=said.map(s=>s.t); console.log('2 two idle minutes in the garden, Pip said:\\n   '+rem.join('\\n   '));
let reps=0; for(let i=1;i<rem.length;i++) if(rem[i]===rem[i-1]) reps++; console.log('   same line twice in a row:', reps, '| distinct lines', new Set(rem).size, 'of', rem.length, '| Pip spoke from', new Set(spots.map(s=>s.join(','))).size, 'different spots');
console.log('   any of it waiting on F:', state.texts.some(t=>t.key==='pip'&&t.hold));
// 3. waiting vs free bubbles look different
state.texts=[]; say('A free line.', state.pip.x, state.pip.y-UNIT*1.3, {key:'pip', hold:false, color:'#bfe4ff'}); say('A waiting line.', h.x, h.y-UNIT*2, {key:'npc', color:'#fdf6e3'}); run(20);
const fr=state.texts.find(t=>t.text==='A free line.'), wt=state.texts.find(t=>t.text==='A waiting line.'); console.log('3 free line waits?', !!(fr&&fr.hold), '| waiting line waits?', !!(wt&&wt.hold), '(drawn: solid, edged, badge vs light, edgeless, italic)');
// 4. names
console.log('4 stones are', RAW.stone, '| charm', WEAR.stonecharm.name, '| gather step', QUESTS.find(q=>q.id==='camp').steps[0].line().slice(0,24));
console.log('BUILD', BUILD, '| errs', errs);
`);
