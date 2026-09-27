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
enterScene('w1', 0.05, 0.5); run(30); h=state.hero; const ks=state.solids.find(o=>o.bar==='crack1' && o.kind==='cracked');
h.x=ks.x-UNIT*1.8; h.y=ks.y; run(2); state.keys[' ']=true; run(1); state.keys[' ']=false; run(8); state.keys.f=true; run(1); state.keys.f=false; run(40); console.log('stomp at the cracked stone: broken?', broken('w1','crack1'));
let throws=0; while (!broken('w1','crack1') && throws<6) { throwAt(ks.x, ks.y); throws++; }
console.log('keystone broken after', throws, 'throw(s)');
for (const seed of [11,23,47,101,2027]) { const W0=buildWorld(seed); console.log('  seed', seed, 'practice stones:', ['knockA','knockB','knockC'].map(n=>W0.w1.solids.find(q=>q.bar===n).stone).join(', '), '| w2:', ['knockD','knockE'].map(n=>W0.w2.solids.find(q=>q.bar===n).stone).join(', ')); }
// practice stones: durability and what's inside
for (const n of ['knockA','knockB','knockC']) { const o=state.solids.find(q=>q.bar===n); if(!o) continue; const cs=WORLD.w1.solids.find(q=>q.bar===n); let t=0; const i0=state.items.length; while(!broken('w1',n) && t<12){ throwAt(o.x,o.y); t++; } console.log('  ', STONES[cs.stone].name.padEnd(9), 'toughness', STONES[cs.stone].dur, '| took', t, 'throws | inside:', state.items.slice(i0).filter(it=>it.type!=='bigrock').map(it=>it.type).join(', ') || 'nothing'); }
// w2: logs fall, gremlins out of the hole, Pip dragged in; smash the hole
enterScene('w2', 0.05, 0.5); run(30); rtFor('w2').flags.crack2=true; refreshSceneGeometry(); run(60*7); h=state.hero;
console.log('abducted', state.inv.pipTaken, '| title', state.title && state.title.sub, '| hole still closed', !broken('w2','burrow'));
const bw=state.solids.find(o=>o.bar==='burrow'); let bt=0; while(!broken('w2','burrow') && bt<6){ throwAt(bw.x,bw.y); bt++; }
console.log('hole smashed after', bt, 'throw(s)'); h.x=W-UNIT*0.6; h.y=bw.y; state.keys.arrowright=true; run(10); state.keys.arrowright=false; run(40); console.log('through the hole ->', state.scene);
console.log('--- lines ---'); log.forEach(l=>console.log('  '+l));
console.log('errs', errs2);
`);