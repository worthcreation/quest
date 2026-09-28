const src = require('./harness.js').src;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); state.cut=null;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const log=[]; const _say=say; say=function(text,x,y,o){ if(o&&(o.key==='pip'||o.key==='npc')) log.push(state.scene+': '+text); return _say(text,x,y,o); };
// jump to a finished camp and let the twilight scene play
state.inv.story=STORY.gather; const rt=rtFor('camp'); ['fire','tent','bench'].forEach(p=>rt.flags['built_'+p]=true); enterScene('camp'); state.cut=null; run(60*6);
for (let k=0;k<60*14 && state.cut;k++) run(1);
console.log('after twilight: scene', state.scene, '| dusk', state.dusk, '| lantern', state.inv.lantern, '| story', state.inv.story);
let h=state.hero; h.x=W*0.5; h.y=H-UNIT*0.6; state.keys.arrowdown=true; run(6); state.keys.arrowdown=false; run(40);
enterScene('start', 0.5, 0.06); run(60*3); h=state.hero;
// the buried rock: grabbing does nothing until it's knocked
const rk=WORLD.start.pullables.find(p=>p.id==='rock'); h.x=rk.fx*W-UNIT*1.2; h.y=rk.fy*H; run(3); state.keys.f=true; run(10); state.keys.f=false; run(2); console.log('grab before knocking: gripping?', state.pull.grip);
state.keys[' ']=true; run(1); state.keys[' ']=false; run(8); state.keys.f=true; run(1); state.keys.f=false; run(40); console.log('stomp beside it: knocked', !!rtFor('start').flags.knocked_rock);
state.keys.f=true; run(3); for (let w=0; w<6; w++){ state.keys[w%2?'arrowright':'arrowleft']=true; run(2); state.keys.arrowright=state.keys.arrowleft=false; run(4); } console.log('  wiggles', state.pull.wiggle, 'need', rk.need); state.keys.arrowup=true; run(2); state.keys.arrowup=false; state.keys.f=false; run(10);
console.log('rocked it out: carrying', state.carry, '| dirt bits flying', state.fx.length > 0);
// throw at the brambles
h.x=W*0.8; h.y=H*0.5; h.fx=1; h.fy=0; run(2); state.keys.f=true; run(40); state.keys.f=false; run(90); console.log('brambles broken', broken('start','thicket'));
const throwAt=(tx,ty)=>{ state.carry='rock'; state.carryT=state.time-1; h.x=tx-UNIT*4.5; h.y=ty; h.fx=1; h.fy=0; run(2); state.keys.f=true; for(let k=0;k<90;k++){ run(1); const [lx,ly]=rockLanding(h); if (Math.hypot(lx-tx,ly-ty)<UNIT*0.35) break; } state.keys.f=false; run(90); };
// w1: a stomp won't do it; a thrown rock will (maybe on the second try)
enterScene('w1', 0.05, 0.5); run(30); h=state.hero; const ks=state.solids.find(o=>o.bar==='crack1' && o.kind==='crag');
h.x=ks.x-UNIT*1.8; h.y=ks.y; run(2); state.keys[' ']=true; run(1); state.keys[' ']=false; run(8); state.keys.f=true; run(1); state.keys.f=false; run(40); console.log('stomp at the cracked stone: broken?', broken('w1','crack1'));
let throws=0; while (!broken('w1','crack1') && throws<8) { throwAt(ks.x-ks.r*0.6, ks.y); throws++; if (!state.items.some(i=>i.type==='bigrock')) {} }
console.log('exit boulder ('+ks.size+' tiles) broken after', throws, 'throw(s) | only it broke:', WORLD.w1.solids.filter(s=>s.kind==='crag' && s.bar!=='crack1').every(s=>!broken('w1',s.bar)), '| a rock left behind:', state.items.some(i=>i.type==='bigrock'));
for (const seed of [11,23,47,101,2027]) { const W0=buildWorld(seed); console.log('  seed', seed, 'boulders:', ['w1','w2','w3'].map(id=>W0[id].solids.filter(s=>s.kind==='crag').map(s=>s.size).join('+')).join(' | ')); }
// w2: the boulders fall, gremlins burst out of the woods ahead, grab Pip and run east; w3: break the cracked boulder on the heap, into the cave
state.inv.story=STORY.adventure; state.inv.pipTaken=false; state.cut=null; enterScene('w1'); run(10); enterScene('w2', 0.05, 0.5); run(30); rtFor('w2').flags.crack2=true; refreshSceneGeometry(); for(let k=0;k<60*14;k++){ run(1); if(state.texts.some(t=>t.hold)){ state.keys.f=true; run(1); state.keys.f=false; } } h=state.hero;
console.log('abducted', state.inv.pipTaken, '| second row of stones on w2?', state.solids.some(o=>o.bar==='burrow'), '| mud on w2?', !!(WORLD.w2.mud&&WORLD.w2.mud.length));
enterScene('w3', 0.05, 0.5); run(30); const ck=state.solids.find(o=>o.bar==='cave' && o.kind==='crag');
const clearFrom=()=>{ for (const a of [Math.PI, Math.PI*0.8, Math.PI*1.2, Math.PI*0.6, Math.PI*1.4, Math.PI/2, Math.PI*1.5]) { const fx=ck.x+Math.cos(a)*(ck.r+UNIT*3.5), fy=ck.y+Math.sin(a)*(ck.r+UNIT*3.5); let ok=fx>UNIT&&fx<W-UNIT&&fy>UNIT&&fy<H-UNIT; for (let k=1;k<10 && ok;k++){ const px=fx+(ck.x-fx)*k/10, py=fy+(ck.y-fy)*k/10; if (state.solids.some(o=>o.bar!=='cave' && Math.hypot(o.x-px,o.y-py)<o.r+UNIT*0.2)) ok=false; } if (ok) return [fx,fy]; } return [ck.x-UNIT*4.5, ck.y]; };
const throwFrom=([fx,fy])=>{ state.carry='rock'; state.carryT=state.time-1; h.x=fx; h.y=fy; const dx=ck.x-fx, dy=ck.y-fy, dl=Math.hypot(dx,dy); h.fx=dx/dl; h.fy=dy/dl; run(2); state.keys.f=true; for(let k=0;k<90;k++){ run(1); const [lx,ly]=rockLanding(h); if (Math.hypot(lx-ck.x,ly-ck.y)<ck.r) break; } state.keys.f=false; run(90); };
let bt=0; const spot=clearFrom(); while(!broken('w3','cave') && bt<8){ throwFrom(spot); bt++; }
console.log('cave stone ('+ck.size+' tiles) broken after', bt, 'throw(s)'); const cv=WORLD.w3.feat.cave; h.x=cv[0]*W; h.y=cv[1]*H+UNIT*0.2; run(10); run(40); console.log('into the cave ->', state.scene);
console.log('--- lines ---'); log.forEach(l=>console.log('  '+l));
console.log('errs', errs2);
`);