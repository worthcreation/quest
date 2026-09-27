const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message, String(e.stack).slice(0,200));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
run(5); state.intro=null; state.texts=[]; enterScene('start'); state.enemies=[]; state.items=[]; run(5); const inv=state.inv, h=state.hero; state.pip&&(state.pip.show=false);
inv.sword=true; inv.acorns=5; inv.woodsword=WOOD_SWORD; run(20);
console.log('1 F:', slotsOf().f&&slotsOf().f.id, '| D:', slotsOf().d&&slotsOf().d.id, '| try acorns on F:', (setSlot('f',{kind:'weapon',id:'acorn'}), slotsOf().f.id), '| food on F:', (setSlot('f',{kind:'food',id:'turnip'}), slotsOf().f.id), '| F offers in the pack for acorns:', slotActs({kind:'weapon',id:'acorn'}).map(a=>a.label).join(','));
// 2. wind up an acorn on D and swing with F at the same time
h.x=W*0.2; h.y=H*0.85; run(3); state.keys.d=true; run(10); state.atkCool=0; state.keys.f=true; run(2); const both=state.aim.on && !!state.atk; state.keys.f=false; run(20); const a0=inv.acorns; state.keys.d=false; run(3);
console.log('2 aiming an acorn while swinging:', both, '| acorn thrown on release of D:', inv.acorns===a0-1, '| still holding the', state.equip);
// 3. the whirlwind grows with sword practice, and rests between
const whirl=(lvl)=>{ setSkillLevel('sword', lvl); state.whirlCool=0; state.whirl=null; startWhirl(); const len=state.whirl? (state.whirl.end-state.time).toFixed(2):'-'; state.whirl&&endWhirl('test'); return len+'s spin, hits x'+whirlHit().toFixed(2)+', rest '+whirlRest()+'s'; };
console.log('3 whirlwind by sword level:', [0,2,4].map(l=>'L'+l+' '+whirl(l)).join(' | '));
setSkillLevel('sword',0); startWhirl(); console.log('   straight after one: another?', !!state.whirl);
console.log('   lunge reach/damage by level:', [0,2,4].map(l=>{ setSkillLevel('sword',l); return 'L'+l+' x'+lungeK().toFixed(1); }).join(', '));
// 4. a wooden sword flies apart in a whirlwind, and on a lunge
inv.sword=false; inv.woodsword=WOOD_SWORD; setSlot('f',{kind:'weapon',id:'woodsword'}); run(10); state.whirlCool=0; startWhirl(); endWhirl('done'); run(3); console.log('4 wooden sword after a whirlwind:', inv.woodsword);
inv.woodsword=WOOD_SWORD; run(20); setSlot('f',{kind:'weapon',id:'woodsword'}); h.vig=maxVig(); state.atkCool=0; state.keys.f=true; run(40); state.keys.f=false; run(30); console.log('   after a lunge:', inv.woodsword);
// 5. crops: rock and pull at first, just F at the top
enterScene('meadow'); inv.story=STORY.tocamp; run(5); const sc=sceneDef(), rt=rtFor('meadow'), q=sc.feat.plots[0];
const ripe=()=>{ rt.flags.plots=sc.feat.plots.map(()=>({s:0,t:0,lv:0})); rt.flags.plots[0]={s:1,t:state.playTime-999,lv:0,seed:'turnipseed'}; h.x=q[0]*W; h.y=q[1]*H; run(3); state.texts=[]; };
inv.cropXp={}; ripe(); const f0=inv.food.length; press('f'); const tapOnly=inv.food.length>f0;
state.keys.f=true; run(3); for(let i=0;i<6;i++){ state.keys[i%2?'arrowright':'arrowleft']=true; run(1); state.keys.arrowleft=state.keys.arrowright=false; run(3); } state.keys.arrowup=true; run(1); state.keys.arrowup=false; run(3); state.keys.f=false; run(10);
console.log('5 farming 0: a tap pulls it?', tapOnly, '| rocked and pulled:', inv.food.length>f0, '| rocks needed by level', CROP_ROCKS.join(','));
inv.cropXp={turnip:60}; ripe(); const f1=inv.food.length; press('f'); run(5); console.log('   farming', farmLevel()+': just F pulls it:', inv.food.length>f1);
console.log('BUILD', BUILD, '| errs', errs);
`);
