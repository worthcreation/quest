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
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const pipLines=[]; const _say=say; say=function(t,x,y,o){ if(o&&o.key==='pip') pipLines.push(state.scene+': '+t); return _say(t,x,y,o); };
begin(); state.cut=null; const inv=state.inv; inv.story=STORY.garden; enterScene('meadow'); state.cut=null; run(3);
const h=state.hero, q=WORLD.meadow.feat.plots[0];
const atPlot=()=>{ h.x=q[0]*W; h.y=q[1]*H; h.vx=h.vy=0; state.pip.visit=null; run(3); };
inv.bag.turnipseed=2; run(20); atPlot(); drawActionHint(); console.log('hint on the patch:', state.actionHint && state.actionHint.verb, state.actionHint && state.actionHint.key);
press('f'); console.log('F: seeds left', inv.bag.turnipseed, '(still 2)');
press('f'); if(state.choice) press('f'); console.log('seed key ('+'slot'+'): seeds left', inv.bag.turnipseed, '| patch planted', rtFor('meadow').flags.plots[0].s===1);
// seeds moved to slot A: the hint follows
rtFor('meadow').flags.plots[0].s=0; slotsOf().a={kind:'seed',id:'auto'}; slotsOf().d=null; atPlot(); drawActionHint(); console.log('seeds in A: hint key', state.actionHint.key);
press('a'); console.log('A plants: seeds left', inv.bag.turnipseed);
// no slot holds seeds: F plants as before
rtFor('meadow').flags.plots[0].s=0; slotsOf().a=null; inv.bag.turnipseed=1; atPlot(); drawActionHint(); console.log('no seed slot: hint key', state.actionHint.key||'F (default)'); press('f'); if(state.choice) press('f'); console.log('F plants: seeds left', inv.bag.turnipseed);
slotsOf().d={kind:'seed',id:'auto'};
// Pip while gathering
inv.story=STORY.gather; state.pip.show=true; state.pip.follow=true; state.pip.visit=null; inv.pipTips={}; const raw=rawOf();
const visit=(id,n=200)=>{ enterScene(id); state.cut=null; state.pip.visit=null; state.pipTalkT=-9; run(n); };
pipLines.length=0;
visit('riverbank'); raw.stone=2; state.pipTalkT=-9; run(600);
visit('start'); raw.stick=3; state.pipTalkT=-9; run(600);
visit('f2'); raw.fluff=2; state.pip.visit=null; state.pipTalkT=-9; run(600);
visit('meadow'); visit('riverbank');
const gl=pipLines.filter(l=>/need|everything|looking/.test(l)); gl.forEach(l=>console.log('  '+l));
console.log('woods line while gathering:', pipLines.some(l=>/other way/.test(l)));
console.log('BUILD', BUILD, '| errs', errs);
`);
