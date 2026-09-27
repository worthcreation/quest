const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }};
run(5); state.intro=null; state.texts=[]; const inv=state.inv, h=state.hero; inv.story=STORY.gather; (inv.pipTips=inv.pipTips||{}).tada=true; (inv.pipTips).craftLesson=true; inv.woodsword=WOOD_SWORD; rawOf().fluff=2;
enterScene('f2'); run(5); const rs=state.enemies.filter(e=>e.type==='rabbit'); console.log('1 rabbits on the second field:', rs.length);
// 2. the tell: it freezes with flashing eyes before it charges
const e=rs[0]; e.mode='idle'; e.cool=0; e.t=0; h.x=e.x+UNIT*3; h.y=e.y; const modes=[]; for(let k=0;k<90;k++){ run(1); if(modes[modes.length-1]!==e.mode) modes.push(e.mode); }
console.log('2 a rabbit near you goes:', modes.join(' > '));
// 3. Pip's combat lines
const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&(o.key==='pip'||o.who==='pip')) said.push(t); return _s(t,x,y,o); }; state.pip={x:h.x-UNIT,y:h.y,show:true,follow:true};
for(let k=0;k<60*30;k++){ run(1); state.pipTalkT=Math.min(state.pipTalkT||0,state.time-7); if(said.some(t=>/lunge/.test(t))) break; }
console.log('3 Pip on the field:\\n   '+said.filter(t=>/eyes|swing/i.test(t)).join('\\n   '));
// 3b. arriving the usual way: Pip's line on the field, and the pinned basics until the rabbits are down
state.coach=null; delete inv.pipTips['coach-combat']; inv.rabbitKills=0; Object.assign(rawOf(),{stick:6,stone:5,fluff:2}); state.pipTalkT=-99; said.length=0; enterScene('f1'); run(10); enterScene('f2'); run(60*3);
const cs=[]; const note=()=>{ const c=state.coach; if(c&&c.id==='combat'){ const t=COACH.combat()[c.i].text; if(cs[cs.length-1]!==t) cs.push(t); } };
note(); for (const e of state.enemies.filter(q=>q.type==='rabbit')) { kill(e); run(10); note(); }
console.log('3b Pip on arrival:', said.filter(t=>/There they are/.test(t))[0]||'(none)');
console.log('   pinned:\\n     '+cs.join('\\n     ')+'\\n     cleared after both:', !(state.coach&&state.coach.id==='combat'));
// 4. the quest HUD stays put and sits under everything
updateQuests(true); run(2); const r0=JSON.stringify(state.questHudRect); showTitle('Test','a new quest','herald',3.6); run(10); const r1=JSON.stringify(state.questHudRect);
console.log('4 quest HUD moved under a banner?', r0!==r1, '| text steers round it?', reservedRects().some(r=>r===state.questHudRect));
console.log('BUILD', BUILD, '| errs', errs);
`);
