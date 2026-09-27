const src = require('./harness.js').src;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
state.inv.sword=true;   // no Pip along
for (const [w,hh] of [[1280,800],[390,844]]) { window.innerWidth=w; window.innerHeight=hh; resize();
  for (const seed of [11, 2719583, 9618677, 424242]) { resetRun(seed); state.cut=null; state.inv.sword=true; const out=[];
    for (const id of ['f3','f4','f5','f6','f7']) { enterScene(id); state.cut=null; state.enemies=[]; const sc=WORLD[id], h=state.hero;
      const L=sc.rocks.filter(r=>r.ledge).sort((a,b)=>a.fy-b.fy); h.x=L[0].fx*W; h.y=L[0].fy*H; h.vx=h.vy=0; run(2);
      const lastY=Math.max(...L.map(r=>r.fy)); let rides=0, falls=0, t=0;
      // play it like a person: stand on a ledge; when the preview points to a lower ledge during a blow, jump; otherwise walk to another ledge on this bank and wait
      while (t < 60*90 && h.y < lastY*H - UNIT*0.3) {
        run(1); t++;
        if (h.falling>0) { falls++; run(60); continue; }
        if (h.ride || h.z>0) continue;
        const tg = state.gustPhase==='blow' && windTarget(sc);
        if (tg && tg[1] > h.y + UNIT) { state.keys[' ']=true; run(1); state.keys[' ']=false; rides++; run(150); continue; }
        if (state.gustPhase==='gentle' && t % 20 === 0) {   // the gentle gusts show the direction: go to a ledge this series will carry down
          const mine=L.filter(r=>Math.abs(r.fy*H-h.y)<UNIT*1.5), pick=mine.find(r=>{ const q=windTarget(sc,{x:r.fx*W,y:r.fy*H}); return q && q[1] > r.fy*H + UNIT; });
          if (pick){ h.x=pick.fx*W; h.y=pick.fy*H; }
        }
      }
      out.push(id+(h.y >= lastY*H - UNIT*0.3 ? ' down in '+rides+' ride(s)'+(falls?' ('+falls+' falls)':'') : ' stuck'));
    }
    console.log(w+'x'+hh, 'seed', seed, '|', out.join(' | '));
  } }
console.log('errs', errs2);
`);