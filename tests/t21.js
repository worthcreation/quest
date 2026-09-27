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
let errs2=0; const run=(n,label)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<6) console.log('ERR', label, state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
// silent spores & mushroom before rescue
enterScene('camp'); state.cut=null; const cs=WORLD.camp.feat.shroom; state.hero.x=cs[0]*W; state.hero.y=cs[1]*H+UNIT*1.5; run(5,'shroom'); state.playTime+=200; run(3,'gather');
console.log('pre-rescue spores', state.inv.spores, 'texts', state.texts.map(t=>t.text).join(' / '));
state.keys.f=true; run(1); state.keys.f=false; run(2); console.log('choice pre-rescue', !!state.choice, state.texts.map(t=>t.text).slice(-1)[0]);
// webs chain in h1
state.inv.fire=true; state.inv.sword=true; state.inv.depth=4; enterScene('h1'); state.cut=null; const n0=state.webs.length; const w0=state.webs[0];
state.enemies.forEach(e=>{ if(e.type!=='lurker'){ e.x=w0.x; e.y=w0.y; } });
igniteWeb(w0); run(200,'webs'); console.log('webs before', n0, 'after chain burn', state.webs.length, 'enemy burn', state.enemies.map(e=>(e.burn||0).toFixed(1)+':'+e.type).join(','));
// hero slowed in web
enterScene('h2'); state.cut=null; const w1=state.webs[0]; state.hero.x=w1.x; state.hero.y=w1.y; state.keys.arrowright=true; run(20); state.keys.arrowright=false; console.log('in web speed px/s', Math.round(Math.hypot(state.hero.vx,state.hero.vy)), 'vs normal', Math.round(sceneDef().speed*L()));
// rescue: burn cocoon, mushroom bursts
enterScene('h3'); state.cut=null; state.enemies=[]; const hero=state.hero; hero.x=W*0.8-UNIT*2.3; hero.y=H*0.5; hero.fx=1; hero.fy=0; hero.vig=maxVig();
state.keys.e=true; run(60); state.keys.e=false; run(240,'burn');
console.log('cocoon', broken('h3','cocoon'), 'dark shroom burst', !!rtFor('h3').flags.darkshroom, 'spore items', state.items.filter(i=>i.type==='spore').length, 'floaters', state.floaters.length);
const sp0=state.inv.spores; for(const it of state.items.filter(i=>i.type==='spore')) { hero.x=it.x; hero.y=it.y; run(2); } console.log('gathered spores', state.inv.spores-sp0);
hero.x=W*0.8-UNIT*1.3; hero.y=H*0.5; for(let k=0;k<7;k++){ state.keys.f=true; run(1); state.keys.f=false; run(3); } run(90); console.log('rescued', state.inv.pipSaved, state.scene);
// tour with strict stub
for (const id of Object.keys(WORLD)) {
  enterScene(id); state.cut=null; state.hero.vig=maxVig();
  for(let f=0;f<400;f++){
    const dirs=['arrowup','arrowdown','arrowleft','arrowright'];
    if(f%40===0){dirs.forEach(d=>state.keys[d]=false); state.keys[dirs[Math.floor(Math.random()*4)]]=true;}
    state.keys.f=(f%23)<9; state.keys.a=f%90===0; state.keys.s=f%300===0; state.keys.d=(f%50)<5; state.keys.e=(f%200)<40; state.keys[' ']=f%70===0;
    const e=state.enemies.find(e=>!e.dead); if(e && f%60<30){ state.hero.x+=(e.x-state.hero.x)*0.05; state.hero.y+=(e.y-state.hero.y)*0.05; }
    state.hero.vig=Math.max(state.hero.vig,5);
    run(1,id); if (state.menu) state.menu=null; if (state.choice) state.choice=null; if (state.cut && state.cut.type!=='faint') state.cut=null;
    if(state.scene!==id) break;
  }
}
console.log('strict tour errs', errs2);
`);