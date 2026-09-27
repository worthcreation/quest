const src = require('./harness.js').src;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null; state.inv.sword=true;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
enterScene('meadow'); state.cut=null; const h=state.hero, b=state.bird, [hx,hy]=hollowPoint();
h.x=hx+UNIT*1.2; h.y=hy+UNIT*1.6; run(5); b.mode='home'; b.t=99; console.log('robin at home:', b.mode);
// a stomp well away from the tree does nothing
h.x=hx+UNIT*6; h.y=hy+UNIT*2; run(2); state.keys[' ']=true; run(1); state.keys[' ']=false; run(8); state.keys.f=true; run(1); state.keys.f=false; run(40); console.log('stomp 6 tiles away: robin', b.mode);
// a stomp by the trunk flushes it out
h.x=hx+UNIT*1.2; h.y=hy+UNIT*1.6; run(2); state.inv.story=STORY.garden; state.inv.firstBirdSeed=false; const s0=(state.inv.bag.seed||0)+state.items.filter(i=>i.type==='seed').length;
state.keys[' ']=true; run(1); state.keys[' ']=false; run(8); state.keys.f=true; run(1); state.keys.f=false; run(10);
console.log('stomp by the trunk: robin', b.mode, '| seed dropped (lesson guarantees the first)', (state.inv.bag.seed||0)+state.items.filter(i=>i.type==='seed').length > s0);
console.log('errs', errs2);
`);