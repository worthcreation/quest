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
begin(); state.cut=null; state.inv.sword=true;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
enterScene('meadow'); state.cut=null; const h=state.hero;
// vigor ranges by vegetable, at level 0 and at level 3
const sample = (k) => { const got=[]; for (let n=0;n<200;n++){ h.vig=1; state.inv.food=[k]; const b=h.vig; eatFood(k); got.push((h.vig-b)/maxVig()); } return [Math.min(...got), Math.max(...got)].map(v=>Math.round(v*100)+'%').join('-'); };
state.inv.vigBonus=40; state.inv.depth=2;
for (const k of ['berries','turnip','carrot','pepper','fish','squash']) { state.inv.cropXp={}; const a=sample(k); state.inv.cropXp={[k]:15}; const b=sample(k); console.log(k.padEnd(8), FOOD[k].rarity.padEnd(9), 'level 0:', a.padEnd(8), '| level 3:', b.padEnd(8), '|', CROP_PERK[k]); }
state.inv.cropXp={};
// harvesting builds crop and farming levels; farming level makes seeds come back more often
const lv=[]; for (let n=0;n<40;n++) { gainCropXp('carrot'); if (n%8===7) lv.push('after '+(n+1)+': carrot '+cropLevel('carrot')+', farming '+farmLevel()); } console.log(lv.join(' | '));
// gusts: sets of three, a long pause between sets, short ones inside, all a little different
enterScene('f3'); state.cut=null; const seq=[]; let ph=state.gustPhase, t0=state.time;
for (let k=0;k<60*60;k++){ update(1/60); if (state.gustPhase!==ph){ seq.push([ph, state.time-t0, state.gustStep]); ph=state.gustPhase; t0=state.time; } }
const gapsBetween=seq.slice(1).filter(q=>q[0]==='lull' && q[2]===1).map(q=>q[1]), gapsInside=seq.filter(q=>q[0]==='lull' && q[2]!==1).map(q=>q[1]);
const f=a=>a.length? Math.min(...a).toFixed(1)+'-'+Math.max(...a).toFixed(1)+'s':'-';
console.log('pause before a set', f(gapsBetween), '| pauses inside a set', f(gapsInside), '| gentle', f(seq.filter(q=>q[0]==='gentle').map(q=>q[1])), '| strong', f(seq.filter(q=>q[0]==='blow').map(q=>q[1])));
// the mushroom's light over a minute: mostly dim, sometimes bright
const g=[]; for (let t=0;t<60;t+=0.25) g.push(shroomGlow(3.1,t)); console.log('mushroom glow: min', Math.min(...g).toFixed(2), 'max', Math.max(...g).toFixed(2), '| share of time above 0.6:', Math.round(g.filter(v=>v>0.6).length/g.length*100)+'%');
// HUD: only the equipped thing (and running effects)
state.inv.acorns=5; state.inv.food=['carrot','squash']; state.inv.bag.seed=3; state.inv.step=1; state.inv.fire=true; const drawn=[]; const oi=drawItemIcon; drawItemIcon=function(t,...a){ drawn.push(t); return oi(t,...a); }; enterScene('meadow'); state.cut=null; drawn.length=0; drawHUD(); drawItemIcon=oi; console.log('HUD icons with sword equipped:', drawn.join(',') || 'none');
console.log('errs', errs2);
`);