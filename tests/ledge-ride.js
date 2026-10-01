const src = require('./harness.js').src;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
for (const [w,hh] of [[1280,800],[390,844]]) { window.innerWidth=w; window.innerHeight=hh; resize();
  for (const seed of [11, 2719583, 9618677]) { resetRun(seed); state.cut=null; const out=[];
    for (const id of ['f1']) { enterScene(id); state.cut=null; state.enemies=[]; const sc=WORLD[id];
      const L=sc.rocks.filter(r=>r.ledge); const bands=[...new Set(L.map(r=>r.fy.toFixed(3)))].map(Number).sort((a,b)=>a-b);
      // can the gusts carry you from each bank to the next one down? and back up?
      let down=0, up=0;
      for (let b=0;b+1<bands.length;b++){ let d=false,u2=false; for (const r of L.filter(q=>Math.abs(q.fy-bands[b])<0.002)) for (let gi=0;gi<sc.gusts.length;gi++){ state.gustIdx=gi; const t=windTarget(sc,{x:r.fx*W,y:r.fy*H}); if(t && Math.abs(t[1]/H-bands[b+1])<0.003) d=true; }
        for (const r of L.filter(q=>Math.abs(q.fy-bands[b+1])<0.002)) for (let gi=0;gi<sc.gusts.length;gi++){ state.gustIdx=gi; const t=windTarget(sc,{x:r.fx*W,y:r.fy*H}); if(t && Math.abs(t[1]/H-bands[b])<0.003) u2=true; }
        if(d) down++; if(u2) up++; }
      out.push(id+': '+L.length+' ledges, banks '+bands.length+', down '+down+'/'+(bands.length-1)+', up '+up+'/'+(bands.length-1));
    }
    console.log(w+'x'+hh, 'seed', seed, '|', out.join(' | '));
  } }
window.innerWidth=1280; window.innerHeight=800; resize(); resetRun(11); state.cut=null;
// the first field's ledges: one bank, so no ride leads anywhere (rides down ledge to ledge come back with the mountain,
// HANDOFF item 3); standing on one, the gust can't move you
enterScene('f1'); state.cut=null; state.enemies=[]; { const sc=WORLD.f1, h=state.hero; const top=sc.rocks.filter(r=>r.ledge).sort((a,b)=>a.fy-b.fy)[0]; h.x=top.fx*W; h.y=top.fy*H; run(2);
  console.log('ledges on f1:', sc.rocks.filter(r=>r.ledge).length, '| a gust with a target from here:', !!windTarget(sc));
  // on a ledge the gust can't move you
  state.gustPhase='blow'; state.gustT=0; const lx=h.x, ly=h.y; for(let k=0;k<30;k++){ state.gustPhase='blow'; state.gustT=0; update(1/60); } console.log('standing on a ledge in a blowing gust moved', (Math.hypot(h.x-lx,h.y-ly)/UNIT).toFixed(2), 'tiles');
  // from the north end, open ground, the strong gust carries you onto a ledge
  state.gustIdx=0; h.x=W*0.05; h.y=H*0.2; run(2); state.gustPhase='blow'; state.gustT=0; state.keys[' ']=true; update(1/60); state.keys[' ']=false; console.log('from the north end, the strong gust rides to a ledge', !!h.ride); if(!h.ride) errs2++;
}
console.log('errs', errs2);
`);