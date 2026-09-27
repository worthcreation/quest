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