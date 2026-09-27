const src=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
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
begin(); step(60*7); state.cut=null; state.inv.sword=true;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
enterScene('f3'); state.cut=null; state.enemies=[];
// the rhythm: record phases for 20 seconds
const seq=[]; let lastPh=''; for (let k=0;k<60*20;k++){ update(1/60); if (state.gustPhase!==lastPh){ lastPh=state.gustPhase; seq.push(lastPh+'('+WORLD.f3.gusts[state.gustIdx].a.toFixed(1)+')'); } }
console.log('rhythm:', seq.slice(0,14).join(' > '));
// gentle gusts nudge, the strong one shoves: measured on open ground, away from ledges and walls
const h=state.hero; const sc=WORLD.f3; let spot=null;
for (let q=0;q<200 && !spot;q++){ const x=W*(0.15+0.7*Math.random()), y=H*(0.13+0.8*Math.random()); if(!onRock(sc,x,y,-UNIT*1.2) && !isChasm(x,y,UNIT*1.2) && !state.solids.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+UNIT*1.3)) spot=[x,y]; }
const push={}; state.cut=null; state.enemies=[]; h.vig=maxVig();
for (const ph of ['gentle','blow']) { h.x=spot[0]; h.y=spot[1]; h.vx=h.vy=0; h.falling=0; h.ride=null; h.z=0; state.gustIdx=1; console.log('  spot', (spot[0]/W).toFixed(2),(spot[1]/H).toFixed(2), 'busy', state.busy, 'cut', state.cut && state.cut.type, 'stun', h.stun); for(let k=0;k<30;k++){ state.gustPhase=ph; state.gustT=0; state.gust= ph==='blow'?1:0.4; update(1/60);} push[ph]=(Math.hypot(h.x-spot[0],h.y-spot[1])/UNIT).toFixed(2); }
console.log('half a second of wind moves you: gentle', push.gentle, 'tiles, strong', push.blow, 'tiles');
// jumping in a gentle gust is a plain jump; in the strong gust it rides
const top=sc.rocks.filter(r=>r.ledge).sort((a,b)=>a.fy-b.fy)[0];
enterScene('f3'); state.cut=null; state.enemies=[]; h.x=top.fx*W; h.y=top.fy*H; update(1/60);
state.gustIdx=0; state.gustStep=3; state.gustPhase='gentle'; state.gustT=0; state.keys[' ']=true; update(1/60); state.keys[' ']=false; console.log('jump in a gentle gust rides?', !!h.ride); run(90);
enterScene('f3'); state.cut=null; state.enemies=[]; h.x=top.fx*W; h.y=top.fy*H; update(1/60);
state.gustIdx=0; state.gustStep=5; state.gustPhase='blow'; state.gustT=1.4; state.keys[' ']=true; update(1/60); state.keys[' ']=false;
console.log('jump late in the strong gust rides?', !!h.ride, 'target existed', !!windTarget(sc));
const r=h.ride; if (r) {
let shadows=[]; const oe=ctx.ellipse.bind(ctx); let lastRx=null; ctx.ellipse=function(x,y,rx,ry,...a){ if (Math.abs(x-(r.x1+2))<1 && Math.abs(y-(r.y1+UNIT*0.45))<1) lastRx=rx; return oe(x,y,rx,ry,...a); };
for (let k=0;k<200 && h.ride;k++){ lastRx=null; update(1/60); draw(); const p=Math.min(1,r.t/r.dur); if (k%10===0) shadows.push((p).toFixed(2)+':'+(lastRx==null?'none':(lastRx/(UNIT*0.55)).toFixed(2))); }
ctx.ellipse=oe;
console.log('landing shadow (ride progress:size vs full):', shadows.join('  '));
console.log('landed on the ledge', Math.hypot(h.x-r.x1,h.y-r.y1)<UNIT*0.5, 'fell', h.falling>0); }
console.log('errs', errs2);
`);