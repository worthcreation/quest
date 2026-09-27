const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message, String(e.stack).slice(0,200));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
const h=state.hero, inv=state.inv;
// 1. patches: F opens a little menu; seeds aren't on any key
enterScene('meadow'); inv.story=STORY.tocamp; run(10); clear(); inv.bag.turnipseed=2; inv.bag.carrotseed=1; inv.acorns=3; run(20);
console.log('1 seeds on a key?', ALL_SLOTS.some(k=>slotsOf()[k]&&slotsOf()[k].kind==='seed'));
const q=WORLD.meadow.feat.plots[1]; h.x=q[0]*W; h.y=q[1]*H; run(3); draw(); console.log('   at the patch:', (state.hintActs||[]).map(a=>a.key+' '+a.verb).join(' | '));
press('f'); console.log('   F opens:', state.choice&&state.choice.text, '->', state.choice&&state.choice.options.join(' / '));
state.choice.sel=state.choice.options.length-1; press('f'); const rt=rtFor('meadow'); console.log('   chose compost: patch level', rt.flags.plots[1].lv, '| acorns', inv.acorns);
press('f'); state.choice.sel=1; press('f'); console.log('   then F, carrot seeds: planted', rt.flags.plots[1].seed);
// 2. A and S hold food and abilities
state.inv.food.push('turnip','carrot'); run(20); console.log('2 food goes to S then A:', ['s','a'].map(k=>k+'='+(slotsOf()[k]?slotsOf()[k].id:'-')).join(' '));
// 3. gathering: Pip leads to each place in turn
const R=rawOf(); for(const k in R) R[k]=0; inv.story=STORY.gather; (inv.pipTips=inv.pipTips||{}).tada=true; rtFor('meadow').flags.plots=WORLD.meadow.feat.plots.map(()=>({s:1,t:0,lv:0,seed:'turnipseed'})); rtFor('camp').flags.built_tent=true; inv.woodsword=0; const path=[];
const step=(fn, label)=>{ fn(); path.push(label+' -> '+tutorialGoal()); };
step(()=>{}, 'nothing'); step(()=>{R.stick=2;}, '2 sticks'); step(()=>{R.stone=2;}, '+2 stones'); step(()=>{R.fluff=2; rtFor('f1').items=rtFor('f1').items.filter(i=>i.type!=='fluff');}, '+2 fluff, field bare');
step(()=>{R.stick=5;}, '+3 more sticks'); step(()=>{inv.woodsword=WOOD_SWORD;}, 'sword made'); step(()=>{R.fluff=3;}, 'third fluff');
console.log('3 where Pip takes you:\\n   '+path.join('\\n   '));
// 4. on the bare field with fluff short: Pip's lines, in order
R.fluff=2; R.stick=3; inv.woodsword=0; const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip') said.push(t); return _s(t,x,y,o); };
enterScene('f1'); state.items=state.items.filter(i=>i.type!=='fluff'); state.enemies=[]; for(let k=0;k<60*40;k++){ run(1); if(k%30===0){ clear(); state.pipTalkT=Math.min(state.pipTalkT||0, state.time-7); } if(said.some(t=>/slap together/.test(t)) && !inv.woodsword){ inv.woodsword=WOOD_SWORD; } }
console.log('4 on the bare field:\\n   '+said.filter(t=>!/Still need|keep looking|what we need/.test(t)).join('\\n   '));
console.log('BUILD', BUILD, '| errs', errs);
`);
