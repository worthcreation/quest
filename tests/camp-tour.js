const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message, String(e.stack).slice(0,200));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<20 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
const h=state.hero, inv=state.inv; const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&(o.key==='pip'||o.who==='pip')) said.push(state.scene+': '+t); return _s(t,x,y,o); };
// 1. the opening line keeps its ellipsis
console.log('1 opening pages start with:', JSON.stringify(speechPages(INTRO_LINES[0])[0].slice(0,18)), '| dusk:', JSON.stringify(speechPages('...and THAT is why we cannot wait!')[0].slice(0,14)));
// 2. the camp tour: follow Pip around
rtFor('meadow').flags.plots=WORLD.meadow.feat.plots.map(()=>({s:1,t:0,lv:0,seed:'turnipseed'})); inv.story=STORY.tocamp; enterScene('camp'); rtFor('camp').flags.built_tent=true;
const steps=[]; for(let k=0;k<60*90;k++){ run(1); if(k%20===0) clear(); const s=state.tutStep; if(steps[steps.length-1]!==s) steps.push(s); const p=state.pip;
  if(p&&p.show){ const tx=p.visit?p.visit.x:p.x, ty=p.visit?p.visit.y:p.y; h.x+=(tx-h.x)*0.03; h.y+=(ty+UNIT*1.2-h.y)*0.03; }
  if(state.scene==='camp' && state.pipGone==='camp' && s==='tour-tent'){ enterScene('tentin'); }
  if(state.scene==='tentin' && state.pipGone==='tentin'){ enterScene('camp', 0.33, 0.45); }
  if(state.scene==='camp' && state.pipGone==='camp' && s==='tour-exit'){ enterScene('start'); break; } }
console.log('2 tour steps in order:', steps.filter(Boolean).join(' > '));
console.log('   Pip said:\\n     '+said.filter(t=>!/Over here|This way!$|Come see|Psst|Whoa/.test(t)).join('\\n     '));
// 3. camp: stones go in one by one, tinder lights it, two frames make the bench
enterScene('camp'); const R=rawOf(); R.stone=3; const fire=WORLD.camp.feat.buildSpots.find(b=>b.piece==='fire'), bench=WORLD.camp.feat.buildSpots.find(b=>b.piece==='bench');
h.x=fire.fx*W; h.y=fire.fy*H+UNIT*(fire.r+0.5); run(3); clear(); press('f'); const s1=campParts().stones; R.stone=2; press('f'); const s2=campParts().stones; R.tinder=1; press('f');
console.log('3 fire ring: stones set', s1, 'then', s2, 'of', CAMP_PARTS.fire.stones, '| lit with tinder', campBuilt('fire'));
R.benchframe=2; h.x=bench.fx*W; h.y=bench.fy*H+UNIT*(bench.r+0.5); run(3); clear(); press('f'); const f1=campParts().frames; press('f'); console.log('   bench: frames', f1, 'then built', campBuilt('bench'), '| camp needs', JSON.stringify(CAMP_NEED));
// 4. the coach stays up until each thing is done, inside the pack too
state.coach=null; delete inv.pipTips['coach-sword']; inv.woodsword=0; inv.sword=false; R.stick=3; startCoach('sword'); const seen=[]; const note=()=>{ const c=state.coach; if(c){ const t=COACH[c.id]()[c.i].text; if(seen[seen.length-1]!==t) seen.push(t); } };
run(30); note(); toggleMenu(); run(5); note(); for(let i=0;i<8 && PACK_TABS[state.menu.tab]!=='Craft';i++){ press('arrowright'); run(3); } note(); run(3);
state.mat=['stick','stick','stick']; run(3); note(); craftNow(); run(3); note(); toggleMenu(); run(5); note();
console.log('4 the coach, step by step:\\n     '+seen.join('\\n     ')+'\\n     done:', !state.coach);
// 5. Pip in the wind
enterScene('f1'); state.enemies=[]; state.pip={x:W*0.5,y:H*0.5,show:true,follow:true}; h.x=W*0.5; h.y=H*0.55; let moved=0; state.gustPhase='blow'; state.gustT=0; state.gustDur=99; const x0=state.pip.x, y0=state.pip.y; run(60);
console.log('5 a gust pushed Pip', (Math.hypot(state.pip.x-x0, state.pip.y-y0)/UNIT).toFixed(1), 'tiles');
console.log('BUILD', BUILD, '| errs', errs);
`);
