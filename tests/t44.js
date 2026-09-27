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
const setMV = v => { state.inv.depth=0; state.inv.tlevel=0; state.inv.vigBonus=v-8; state.hero.vig=maxVig(); };
const hopTo=(tx,ty)=>{ const h=state.hero, dx=tx-h.x, dy=ty-h.y, d=Math.hypot(dx,dy)||1; state.keys.arrowright=dx/d>0.38; state.keys.arrowleft=dx/d<-0.38; state.keys.arrowdown=dy/d>0.38; state.keys.arrowup=dy/d<-0.38; state.keys[' ']=true; run(1); state.keys[' ']=false; for(let k=0;k<90;k++){ run(1); if(h.falling>0) break; if(h.z<=0&&k>2) break; } ['arrowright','arrowleft','arrowdown','arrowup'].forEach(k=>state.keys[k]=false); run(2); return h.falling<=0; };
// cross each field ravine rock by rock, no gusts, at base vigor
for (const [w,hh] of [[1280,800],[390,844]]) { window.innerWidth=w; window.innerHeight=hh; resize(); const out=[];
  for (const id of ['f3','f4','f5','f6','f7']) { setMV(8); enterScene(id, 0.5, 0.06); state.cut=null; state.enemies=[]; state.gustPhase='lull'; state.gustT=99; const sc=WORLD[id], h=state.hero; let ok=true;
    sc.chasms.forEach((c,i)=>{ if(!ok) return; const col=sc.rocks.filter(r=>r.island && r.fy>c[1] && r.fy<c[3]).sort((a,b)=>a.fy-b.fy); if(!col.length){ out.push(id+' band '+(i+1)+' is walked around'); return; } const x=col[0].fx*W;
      if (isChasm(x, c[1]*H-UNIT*0.6) || isChasm(x, c[3]*H+UNIT*0.6)) { out.push(id+' band '+(i+1)+' is walked around'); return; }
      h.x=x; h.y=c[1]*H-UNIT*0.5; h.vx=h.vy=0; run(3);
      for (const r of col) if(!hopTo(x, r.fy*H)) { ok=false; out.push(id+': fell reaching rock'); return; }
      if(!hopTo(x, c[3]*H+UNIT*0.7)) { ok=false; out.push(id+': fell leaving rock'); } });
    if (ok) out.push(id+' ok ('+sc.rocks.filter(r=>r.island).length+' rocks)');
  }
  console.log(w+'x'+hh, out.join(' | ')); }
window.innerWidth=1280; window.innerHeight=800; resize();
// on rock the gust can't move you; off rock it does
enterScene('f4'); state.cut=null; state.enemies=[]; { const sc=WORLD.f4, h=state.hero, bank=sc.rocks.find(r=>!r.island); h.x=bank.fx*W; h.y=bank.fy*H; state.gustPhase='blow'; state.gustIdx=0; state.gust=1; const x0=h.x, y0=h.y; run(60); console.log('on a rock slab in a blowing gust: moved', (Math.hypot(h.x-x0,h.y-y0)/UNIT).toFixed(2), 'tiles'); h.x=W*0.15; h.y=bank.fy*H; const x1=h.x,y1=h.y; state.gustPhase='blow'; run(60); console.log('off the rock: moved', (Math.hypot(h.x-x1,h.y-y1)/UNIT).toFixed(2), 'tiles'); }
// the too-strong gust: tumbled back onto your bank, not off the mountain
enterScene('f5'); state.cut=null; state.enemies=[]; { const h=state.hero; h.x=W*0.5; h.y=H*0.2; run(30); const safe=h.safe.slice(); h.ride={ t:0, dur:1, x0:h.x, y0:h.y, x1:h.x, y1:h.y-H*0.3, blown:true }; run(90); console.log('too-strong gust leaves you in', state.scene, 'back at your bank', Math.hypot(h.x/W-safe[0], h.y/H-safe[1])<0.05); }
// fainting mid-crossing puts you back on the last stone, not the bank you started from
enterScene('ford'); state.cut=null; { const h=state.hero, S=WORLD.ford.river.stones; h.x=S[3][0]*W; h.y=S[3][1]*H; run(10); console.log('stone counts as last footing', Math.hypot(h.safe[0]-S[3][0], h.safe[1]-S[3][1])<0.02); h.vig=0.1; hurtHero(5, h.x, h.y); run(60*3); console.log('after fainting: scene', state.scene, 'on stone 4', Math.hypot(h.x/W-S[3][0], h.y/H-S[3][1])<0.03); }
// the crags: locked until the tortoise, then climb all three at max vigor 12
state.inv.tortoise=false; enterScene('f7'); state.cut=null; state.enemies=[]; { const h=state.hero; h.x=W-UNIT*0.6; h.y=H*0.85; state.keys.arrowright=true; run(10); state.keys.arrowright=false; run(30); console.log('before the tortoise, east of f7 ->', state.scene); }
state.inv.tortoise=true; { const h=state.hero; h.x=W-UNIT*0.6; h.y=H*0.85; state.keys.arrowright=true; run(10); state.keys.arrowright=false; run(40); console.log('after the tortoise ->', state.scene); }
for (const [w,hh] of [[1280,800],[390,844]]) { window.innerWidth=w; window.innerHeight=hh; resize(); const out=[];
  for (const id of ['peak1','peak2','peak3']) { setMV(12); enterScene(id, 0.5, 0.94); state.cut=null; state.enemies=[]; const sc=WORLD[id], h=state.hero; let ok=true;
    for (const c of sc.chasms) { const gap=(c[3]-c[1])*H/UNIT; let cx=W*0.2; for (let q=0.15;q<0.86;q+=0.05){ if(!state.solids.some(s=>Math.hypot(s.x-q*W,s.y-c[1]*H)<s.r+UNIT*1.5 || Math.hypot(s.x-q*W,s.y-c[3]*H)<s.r+UNIT*1.5)){ cx=q*W; break; } } h.x=cx; h.y=c[3]*H+UNIT*0.5; run(3); if(!hopTo(cx, c[1]*H-UNIT*0.8)) { ok=false; out.push(id+' fell ('+gap.toFixed(1)+' tiles)'); break; } }
    out.push(id+(ok?' ravines '+sc.chasms.map(c=>((c[3]-c[1])*H/UNIT).toFixed(1)).join('/')+' tiles, crossed':''));
  }
  console.log(w+'x'+hh, out.join(' | ')); }
window.innerWidth=1280; window.innerHeight=800; resize();
console.log('errs', errs2);
`);