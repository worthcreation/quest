const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<20 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
run(10); for(let i=0;i<6 && state.intro && !state.intro.gone;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
const inv=state.inv, h=state.hero;
enterScene('meadow'); for(let k=0;k<60*6;k++) run(1);
console.log('1 garden: a pinned note too?', !!state.coach, '| Pip teaching:', (state.texts.find(t=>t.key==='pip')||{}).text ? 'yes' : 'no');
// 2. a Pip line about swinging flashes F; one about throwing acorns flashes the acorn key
inv.sword=true; inv.acorns=5; run(20); state.slotFlash=null; say('Then swing (F) while it is close!', h.x, h.y, {key:'pip'}); console.log('2 swing advice flashes:', state.slotFlash&&state.slotFlash.k);
state.slotFlash=null; say('Throw an acorn at it!', h.x, h.y, {key:'pip'}); console.log('   acorn advice flashes:', state.slotFlash&&state.slotFlash.k);
// 3. the first ripe turnip: Pip shows you how to pull it
state.texts=[]; inv.sword=false; inv.woodsword=0; inv.story=STORY.gather; inv.harvests=0; const rt=rtFor('meadow'); rt.flags.plots=WORLD.meadow.feat.plots.map(()=>({s:1,t:state.playTime-999,lv:0,seed:'turnipseed'})); enterScene('meadow'); state.pipTalkT=-99; const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip') said.push(t); return _s(t,x,y,o); };
for(let k=0;k<60*10;k++){ run(1); state.pipTalkT=Math.min(state.pipTalkT||0,state.time-7); if(said.some(t=>/ripe/.test(t))) break; }
console.log('3 ripe turnip, Pip says:', said.filter(t=>/ripe/.test(t))[0]||'(nothing)');
// 4. inside the pack, the pinned step still shows; outside, Pip says it
state.coach=null; delete inv.pipTips['coach-sword']; inv.woodsword=0; inv.sword=false; rawOf().stick=3; said.length=0; state.pip={x:h.x+UNIT,y:h.y,show:true,follow:true}; startCoach('sword'); run(5);
console.log('4 coach step outside the pack, said by Pip:', said[0]||'(nothing)');
console.log('BUILD', BUILD, '| errs', errs);
`);
