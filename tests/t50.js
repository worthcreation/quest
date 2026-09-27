const src=require('fs').readFileSync('/mnt/user-data/outputs/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const noop=()=>{}; const grad={addColorStop:(o,c)=>{ if(!(o>=0&&o<=1)) throw new Error('colorstop offset '+o); if(/NaN|undefined|Infinity/.test(String(c))) throw new Error('bad color '+c); }};
const chk=(name,vals)=>{ for(const v of vals) if(!(isFinite(v))) throw new Error(name+' non-finite '+vals.join(',')); };
const mkctx=()=>new Proxy({},{get:(t,k)=>{ if(k in t) return t[k];
 if(k==='measureText') return (s)=>({width:s.length*8});
 if(k==='arc') return (x,y,r)=>{ chk('arc',[x,y,r]); if(r<0) throw new Error('arc negative radius '+r); };
 if(k==='ellipse') return (x,y,rx,ry)=>{ chk('ellipse',[x,y,rx,ry]); if(rx<0||ry<0) throw new Error('ellipse negative radius '+rx+','+ry); };
 if(k==='createRadialGradient') return (x0,y0,r0,x1,y1,r1)=>{ chk('radial',[x0,y0,r0,x1,y1,r1]); if(r0<0||r1<0) throw new Error('radial negative '+r0+','+r1); return grad; };
 if(k==='createLinearGradient') return (a,b,c,d)=>{ chk('linear',[a,b,c,d]); return grad; };
 if(k==='addColorStop') return noop;
 if(k.startsWith('create')) return ()=>grad; return noop; },set:(t,k,v)=>(t[k]=v,true)});
const el=()=>({addEventListener:noop,getContext:mkctx,remove:noop,style:{},classList:{toggle:noop},dataset:{}});
const P=()=>{const param={value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}};
 return new Proxy({},{get:(t,k)=>{ if(k in t) return t[k]; if(['gain','frequency','Q','pan'].includes(k)) return t[k]=param; if(k==='connect') return (n)=>n||P(); if(k==='getChannelData') return ()=>new Float32Array(10); return ()=>P(); }, set:(t,k,v)=>(t[k]=v,true)});};
class AC{constructor(){this.currentTime=0;this.sampleRate=100;this.state='running';this.destination=P();} createGain(){return P()} createOscillator(){return P()} createBufferSource(){return P()} createBiquadFilter(){return P()} createStereoPanner(){return P()} createBuffer(){return P()} resume(){}}
global.document={getElementById:el,querySelectorAll:()=>[],createElement:el,documentElement:{},addEventListener:noop};
global.window={AudioContext:AC,innerWidth:1280,innerHeight:800,devicePixelRatio:1,addEventListener:noop,matchMedia:()=>({matches:false})};
const store={}; global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)}};
global.setTimeout=(f)=>{f()}; global.setInterval=noop; global.requestAnimationFrame=noop; global.performance={now:()=>0};
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
for (const [w,hh] of [[1280,800],[390,844]]) { window.innerWidth=w; window.innerHeight=hh; resize();
  for (const seed of [11, 2719583, 9618677]) { resetRun(seed); state.cut=null; const out=[];
    for (const id of ['f1','f2','f3','f4','f5','f6','f7']) { enterScene(id); state.cut=null; state.enemies=[]; const sc=WORLD[id];
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
// a real ride: stand on a top-bank ledge, wait for a gust that has a target, jump, land on the target
enterScene('f3'); state.cut=null; state.enemies=[]; { const sc=WORLD.f3, h=state.hero; const top=sc.rocks.filter(r=>r.ledge).sort((a,b)=>a.fy-b.fy)[0]; h.x=top.fx*W; h.y=top.fy*H; run(2);
  let tgt=null; for (let k=0;k<60*12;k++){ run(1); if (state.gustPhase==='blow' && (tgt=windTarget(sc)) && tgt[1]>h.y+UNIT) break; tgt=null; }
  const x0=h.x,y0=h.y; state.keys[' ']=true; run(1); state.keys[' ']=false; const riding=!!h.ride; run(150);
  console.log('ride from ledge: started', riding, '| landed on target', tgt && Math.hypot(h.x-tgt[0],h.y-tgt[1])<UNIT*0.5, '| crossed the ravine', h.y>sc.chasms[0][3]*H, '| fell', h.falling>0, '| camera released', !state.cam.focus);
  // on a ledge the gust can't move you
  state.gustPhase='blow'; state.gustT=0; const lx=h.x, ly=h.y; for(let k=0;k<30;k++){ state.gustPhase='blow'; state.gustT=0; update(1/60); } console.log('standing on a ledge in a blowing gust moved', (Math.hypot(h.x-lx,h.y-ly)/UNIT).toFixed(2), 'tiles');
  // jumping when no ledge lies downwind is just a jump
  state.gustIdx=0; h.x=W*0.05; h.y=H*0.2; run(2); state.gustPhase='blow'; state.gustT=0; state.keys[' ']=true; update(1/60); state.keys[' ']=false; console.log('no ledge downwind: plain jump', !h.ride);
}
console.log('errs', errs2);
`);