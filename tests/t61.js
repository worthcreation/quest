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
begin(); state.cut=null; state.inv.sword=true;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
enterScene('meadow'); state.cut=null; const h=state.hero, inv=state.inv; run(3);
console.log('default slots', JSON.stringify(slotsOf()));
inv.food=['carrot','berries']; h.vig=2; press('s'); console.log('S eats: food left', inv.food.join(','));
const q=WORLD.meadow.feat.plots[0]; inv.bag.seed=2; h.x=q[0]*W; h.y=q[1]*H; run(2); press('d'); console.log('D plants on rich soil:', (rtFor('meadow').flags.plots||[])[0] && rtFor('meadow').flags.plots[0].s===1, '| seeds left', inv.bag.seed);
h.x=W*0.9; h.y=H*0.9; run(2); press('d'); console.log('D away from soil: seeds left', inv.bag.seed);
inv.step=1; slotsOf(); console.log('A after getting the dodge relic:', JSON.stringify(slotsOf().a));
h.fx=1; h.fy=0; const x0=h.x; press('a',1); run(10); console.log('A dodges: moved', ((h.x-x0)/UNIT).toFixed(1), 'tiles');
// customise: carrot into A, fire into D, acorns into S
slotsOf().a={kind:'food',id:'carrot'}; inv.food=['carrot']; h.vig=2; press('a'); console.log('carrot in A: eaten', !inv.food.includes('carrot'));
inv.fire=true; slotsOf().d={kind:'ability',id:'fire'}; state.keys.d=true; run(20); console.log('fire in D, holding D: breathing', state.fireHold.on); state.keys.d=false; run(20);
inv.acorns=5; slotsOf().s={kind:'weapon',id:'acorn'}; press('s'); console.log('acorns in S: equipped', state.equip);
// the HUD bar: four boxes under the vigor bar, in A S D F order
const boxes=[]; const fr=ctx.fillRect.bind(ctx); ctx.fillRect=function(x,y,w,hh){ if (Math.abs(w-hh)<0.5 && w>20 && w<40) boxes.push([Math.round(x),Math.round(y)]); return fr(x,y,w,hh); }; drawHUD(); ctx.fillRect=fr;
console.log('slot boxes drawn (x,y):', boxes.slice(0,4).map(b=>b.join(',')).join('  '));
// text boxes: placed once, then they stay put even as you walk
sayHero('Testing a fixed box.', { life: 3 }); run(2); const t=state.texts.find(x=>x.text==='Testing a fixed box.'); const p0=t.pos && {...t.pos};
state.keys.arrowright=true; run(40); state.keys.arrowright=false; const p1=t.pos;
console.log('text box first at', p0 && Math.round(p0.x)+','+Math.round(p0.y), '| after walking', p1 && Math.round(p1.x)+','+Math.round(p1.y), '| width fits text', p0 && Math.round(p0.w));
console.log('errs', errs2);
`);