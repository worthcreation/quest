const src = require('./harness.js').src;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin();
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const log=[]; const _say=say; say=function(text,x,y,o){ if(o&&(o.key==='pip'||o.key==='npc')) log.push(text); return _say(text,x,y,o); };
// build 65 opening: read Pip's three lines with F, wait for Pip to head south, walk out the south edge, clear the quest alert
const opening=()=>{ run(20); for(let i=0;i<6 && state.intro && !state.intro.gone;i++){ press('f'); run(25);} for(let k=0;k<60*14 && state.intro;k++) run(1); if(state.title&&state.title.hold) press('f'); const hh=state.hero; hh.x=W*0.5; hh.y=H-UNIT*0.6; run(3); state.keys.arrowdown=true; run(90); state.keys.arrowdown=false; run(40); };
opening(); const clearHeld=()=>{ while(state.texts.some(t=>t.hold)||(state.title&&state.title.hold)){ press('f'); run(4);} };
let h=state.hero; console.log('in the garden: seeds', state.inv.bag.turnipseed||0, '| story', state.inv.story);
const walkTo=(x,y,n=300)=>{ for(let k=0;k<n;k++){ const dx=x-h.x, dy=y-h.y; if(Math.hypot(dx,dy)<UNIT*0.6) break; state.keys.arrowright=dx>6; state.keys.arrowleft=dx<-6; state.keys.arrowdown=dy>6; state.keys.arrowup=dy<-6; run(1);} ['arrowright','arrowleft','arrowdown','arrowup'].forEach(k=>state.keys[k]=false); };
let tries=0, drops=0; const _sb=scareBird; scareBird=function(x,y,r){ const b=state.bird; const was=b&&b.mode; const n0=state.items.filter(i=>i.type==='turnipseed').length; const c0=state.inv.bag.turnipseed||0; _sb(x,y,r); if (was==='perch' && state.bird.mode==='fly') console.log('  startled the robin: seed', state.items.filter(i=>i.type==='turnipseed').length>n0 || (state.inv.bag.turnipseed||0)>c0, '| story', state.inv.story, '| pip shown', !!(state.pip&&state.pip.show)); };
const tryRobin=()=>{ for(let k=0;k<60*15 && !(state.bird && state.bird.mode==='perch');k++){ h.x=W*0.95; h.y=H*0.9; run(1); } if(!(state.bird&&state.bird.mode==='perch')) return; tries++; const b=state.bird; const s0=state.items.filter(i=>i.type==='turnipseed').length; clearHeld(); h.x=b.x; h.y=b.y+UNIT*3; run(2); walkTo(b.x, b.y+UNIT*1.2); run(30); const s1=state.items.filter(i=>i.type==='turnipseed').length; if (s1>s0) { drops++; const sd=state.items.filter(i=>i.type==='turnipseed').pop(); h.x=sd.x+UNIT*0.9; h.y=sd.y; run(2); walkTo(sd.x, sd.y); run(5); for(let i=0;i<8 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f'); press('f'); run(3); } };
const plantOne=()=>{ const rt=rtFor('meadow'), plots=WORLD.meadow.feat.plots; const j=plots.findIndex((q,ix)=>!((rt.flags.plots||[])[ix]||{}).s); const q=plots[j]; h.x=q[0]*W; h.y=q[1]*H; run(3); clearHeld(); press('f'); if(state.choice) press('f'); run(30); };
tryRobin(); console.log('first try: seed dropped', drops===1, '| seeds in pack', state.inv.bag.turnipseed);
plantOne(); run(60*3);
while ((state.inv.bag.turnipseed||0)===0 && tries<25) { tryRobin(); run(60*3); }
console.log('second seed after', tries-1, 'more tries');
plantOne(); run(60*6);
console.log('planted', (rtFor('meadow').flags.plots||[]).filter(p=>p.s===1).length, '| story', state.inv.story, '(2 = off to camp)');
console.log('--- Pip ---'); log.forEach(l=>console.log('  '+l));
console.log('errs', errs2);
`);