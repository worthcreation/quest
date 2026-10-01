const src = require('./harness.js').src;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const setMV = v => { state.inv.depth=0; state.inv.tlevel=0; state.inv.vigBonus=v-8; state.hero.vig=maxVig(); };
const hopTo=(tx,ty)=>{ const h=state.hero, dx=tx-h.x, dy=ty-h.y, d=Math.hypot(dx,dy)||1; state.keys.arrowright=dx/d>0.38; state.keys.arrowleft=dx/d<-0.38; state.keys.arrowdown=dy/d>0.38; state.keys.arrowup=dy/d<-0.38; state.keys[' ']=true; run(1); state.keys[' ']=false; for(let k=0;k<90;k++){ run(1); if(h.falling>0) break; if(h.z<=0&&k>2) break; } ['arrowright','arrowleft','arrowdown','arrowup'].forEach(k=>state.keys[k]=false); run(2); return h.falling<=0; };
// on rock the gust can't move you; off rock it does
enterScene('f1'); state.cut=null; state.enemies=[]; { const sc=WORLD.f1, h=state.hero, bank=sc.rocks.find(r=>r.ledge); h.x=bank.fx*W; h.y=bank.fy*H; state.gustPhase='blow'; state.gustIdx=0; state.gust=1; const x0=h.x, y0=h.y; run(60); console.log('on a rock slab in a blowing gust: moved', (Math.hypot(h.x-x0,h.y-y0)/UNIT).toFixed(2), 'tiles'); let ox=W*0.5, oy=H*0.5; for (let q=0;q<200;q++){ if(!onRock(sc,ox,oy,-UNIT*1.2) && !state.solids.some(o=>Math.hypot(o.x-ox,o.y-oy)<o.r+UNIT*2)) break; ox=W*(0.15+0.7*Math.random()); oy=H*(0.15+0.7*Math.random()); } h.x=ox; h.y=oy; const x1=h.x,y1=h.y; state.gustPhase='blow'; run(60); console.log('off the rock: moved', (Math.hypot(h.x-x1,h.y-y1)/UNIT).toFixed(2), 'tiles'); }
// fainting mid-crossing puts you back on the last stone, not the bank you started from
enterScene('ford'); state.cut=null; { const h=state.hero, S=WORLD.ford.river.stones; h.x=S[3][0]*W; h.y=S[3][1]*H; run(10); console.log('stone counts as last footing', Math.hypot(h.safe[0]-S[3][0], h.safe[1]-S[3][1])<0.02); h.vig=0.1; hurtHero(5, h.x, h.y); run(60*3); console.log('after fainting: scene', state.scene, 'on stone 4', Math.hypot(h.x/W-S[3][0], h.y/H-S[3][1])<0.03); }
// the crags: climb all three at max vigor 12
for (const [w,hh] of [[1280,800],[390,844]]) { window.innerWidth=w; window.innerHeight=hh; resize(); const out=[];
  for (const id of ['peak1','peak2','peak3']) { setMV(12); enterScene(id, 0.5, 0.94); state.cut=null; state.enemies=[]; const sc=WORLD[id], h=state.hero; let ok=true;
    for (const c of sc.chasms) { const gap=(c[3]-c[1])*H/UNIT; let cx=W*0.2; for (let q=0.15;q<0.86;q+=0.05){ if(!state.solids.some(s=>Math.hypot(s.x-q*W,s.y-c[1]*H)<s.r+UNIT*1.5 || Math.hypot(s.x-q*W,s.y-c[3]*H)<s.r+UNIT*1.5)){ cx=q*W; break; } } h.x=cx; h.y=c[3]*H+UNIT*0.5; run(3); if(!hopTo(cx, c[1]*H-UNIT*0.8)) { ok=false; out.push(id+' fell ('+gap.toFixed(1)+' tiles)'); break; } }
    out.push(id+(ok?' ravines '+sc.chasms.map(c=>((c[3]-c[1])*H/UNIT).toFixed(1)).join('/')+' tiles, crossed':''));
  }
  console.log(w+'x'+hh, out.join(' | ')); }
window.innerWidth=1280; window.innerHeight=800; resize();
console.log('errs', errs2);
`);