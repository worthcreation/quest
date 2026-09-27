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
begin(); step(60*7); state.cut=null; state.inv.sword=true;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
enterScene('camp'); state.cut=null; const h=state.hero, q=WORLD.camp.feat.plots[0]; const rt=rtFor('camp');
h.x=q[0]*W; h.y=q[1]*H; run(3); rt.flags.plots = rt.flags.plots || WORLD.camp.feat.plots.map(()=>({s:0,t:0,lv:0}));
const p=rt.flags.plots[0]; console.log('camp patch starts as', patchOf(p).name, '| foot farm starts as', (rtFor('foot'), PATCH[WORLD.foot.feat.plotLv].name));
Object.keys(state.inv.bag).forEach(k=>state.inv.bag[k]=0); state.inv.acorns=3; run(2); console.log('label with no seeds but 3 acorns:', state.actionHint && state.actionHint.verb);
press('f'); console.log('choice:', state.choice && state.choice.opts ? state.choice.opts.join(' | ') : JSON.stringify(state.choice && Object.keys(state.choice)));
press('f'); console.log('patch now', patchOf(p).name, '| acorns left', state.inv.acorns);
state.inv.bag.seed=2; state.inv.mats.thorn=3; press('f'); console.log('with seeds and thorns, choice:', state.choice && (state.choice.opts||state.choice.options||[]).join(' | '));
if (state.choice) { state.choice.sel=(state.choice.opts||state.choice.options).length-1; press('f'); } console.log('patch now', patchOf(p).name);
state.inv.mats.ironwood=1; state.inv.mats.ember=1; press('f'); if (state.choice){ state.choice.sel=(state.choice.opts||state.choice.options).length-1; press('f'); } console.log('patch now', patchOf(p).name, '| next', PATCH[p.lv+1] ? 'more' : 'maxed');
// how much faster, how much more
const grow = lv => { const pp={s:1,t:state.playTime,seed:'seed',lv}; let t=0; while (plotStage(pp)<3 && t<200){ state.playTime+=0.5; t+=0.5; } state.playTime-=t; return t; };
console.log('seconds to ripen a common seed: wild', grow(0), '| tilled', grow(1), '| framed', grow(2), '| raised', grow(3));
for (const lv of [0,1,2,3]) { let ex=0, back=0, N=400; for (let n=0;n<N;n++){ const P=PATCH[lv]; if (rng()<P.bonus) ex++; if (rng()<P.seedBack) back++; } console.log('  '+PATCH[lv].name.padEnd(13), 'extra harvest', Math.round(ex/4)+'%', '| seed back', Math.round(back/4)+'%'); }
// a real harvest on the raised bed
state.inv.bag.seed=1; press('f'); if (state.choice){ state.choice.sel=0; press('f'); } console.log('planted', p.s===1); state.playTime+=60; run(2); const food0=state.inv.food.length; press('f'); run(30); console.log('harvested', state.inv.food.length-food0, 'food');
console.log('errs', errs2);
`);