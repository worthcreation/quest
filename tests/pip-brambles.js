const src = require('./harness.js').src;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin();
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
run(60*7);
enterScene('start', 0.1, 0.5); state.cut=null; const h=state.hero; h.x=W*0.55; h.y=H*0.5; state.inv.pipTips={go:true}; run(60*3);
const p=state.pip; console.log('pip heading to the brambles', !!p.visit);
run(60*4); const spot=p.visit && p.visit.spot; console.log('said it and waiting', !!(p.visit&&p.visit.said), 'at', spot && ((spot[0]/W).toFixed(2)+','+(spot[1]/H).toFixed(2)));
// walk the other way: Pip should stay put, not snap back
state.keys.arrowleft=true; run(40); state.keys.arrowleft=false; run(60*9);
console.log('you walked away: Pip moved', spot ? (Math.hypot(p.x-spot[0],p.y-spot[1])/UNIT).toFixed(2) : '?', 'tiles, still waiting', !!p.visit, '| nudged', state.texts.some(t=>t.text==='Over here!'));
// come over: Pip rejoins and leads on
for (let k=0;k<400 && p.visit;k++){ const dx=p.x-h.x, dy=p.y-h.y; state.keys.arrowright=dx>UNIT; state.keys.arrowleft=dx<-UNIT; state.keys.arrowdown=dy>UNIT; state.keys.arrowup=dy<-UNIT; run(1); }
['arrowright','arrowleft','arrowdown','arrowup'].forEach(k=>state.keys[k]=false); run(30);
console.log('same pip', state.pip===p, 'visit', JSON.stringify(state.pip.visit), 'scene', state.scene); console.log('you came over: Pip following again', !state.pip.visit, 'distance', (Math.hypot(p.x-h.x,p.y-h.y)/UNIT).toFixed(1));
console.log('errs', errs2);
`);