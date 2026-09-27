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
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }};
run(5); state.intro=null; state.texts=[];
// 1. a thrown rock on soft ground buries itself now and then
enterScene('start'); state.enemies=[]; let buried=0, lay=0; const h=state.hero;
for(let k=0;k<200;k++){ const x=W*(0.3+0.4*Math.random()), y=H*(0.3+0.4*Math.random()); if(!earthen(x,y)) continue; const n0=sceneDef().pullables.filter(p=>p.mud).length, i0=state.items.filter(i=>i.type==='bigrock').length;
  state.shots.push({kind:'rock', x, y, z:UNIT*0.05, vz:-UNIT*2, g:UNIT*30, vx:0, vy:0, spin:0, hit:new Set(), force:1}); run(3);
  if (sceneDef().pullables.filter(p=>p.mud).length>n0) buried++; else if (state.items.filter(i=>i.type==='bigrock').length>i0) lay++; }
console.log('1 rocks landing on the glade: buried', buried, '| lay where they fell', lay, '| buried share', Math.round(buried/Math.max(1,buried+lay)*100)+'%', '| cave floor earthen?', earthen(W/2,H/2,{area:'cave'}));
// 2. breakable stones are bigger than a thrown rock
const ks=Object.values(WORLD).flatMap(s=>s.solids.filter(o=>o.kind==='cracked')); console.log('2 breakable stone sizes (tiles):', [...new Set(ks.map(o=>o.r))].join(', '), '| thrown rock 0.6');
// 3. one banner style
state.title=null; showTitle('Old Wick\\'s fishing rod','stand by a ripple','relic',3.5); console.log('3 a relic title now shows as', state.title&&state.title.style); state.title=null; showTitle('X','y','quest',3); console.log('   a quest title now shows as', state.title&&state.title.style);
console.log('BUILD', BUILD, '| errs', errs);
`);
