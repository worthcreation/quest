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