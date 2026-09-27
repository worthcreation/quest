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
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message, String(e.stack).slice(0,200));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
const h=state.hero, inv=state.inv;
// 1. patches: F opens a little menu; seeds aren't on any key
enterScene('meadow'); inv.story=STORY.tocamp; run(10); clear(); inv.bag.turnipseed=2; inv.bag.carrotseed=1; inv.acorns=3; run(20);
console.log('1 seeds on a key?', ALL_SLOTS.some(k=>slotsOf()[k]&&slotsOf()[k].kind==='seed'));
const q=WORLD.meadow.feat.plots[1]; h.x=q[0]*W; h.y=q[1]*H; run(3); draw(); console.log('   at the patch:', (state.hintActs||[]).map(a=>a.key+' '+a.verb).join(' | '));
press('f'); console.log('   F opens:', state.choice&&state.choice.text, '->', state.choice&&state.choice.options.join(' / '));
state.choice.sel=state.choice.options.length-1; press('f'); const rt=rtFor('meadow'); console.log('   chose compost: patch level', rt.flags.plots[1].lv, '| acorns', inv.acorns);
press('f'); state.choice.sel=1; press('f'); console.log('   then F, carrot seeds: planted', rt.flags.plots[1].seed);
// 2. A and S hold food and abilities
state.inv.food.push('turnip','carrot'); run(20); console.log('2 food goes to S then A:', ['s','a'].map(k=>k+'='+(slotsOf()[k]?slotsOf()[k].id:'-')).join(' '));
// 3. gathering: Pip leads to each place in turn
const R=rawOf(); for(const k in R) R[k]=0; inv.story=STORY.gather; inv.woodsword=0; const path=[];
const step=(fn, label)=>{ fn(); path.push(label+' -> '+gatherGoal()); };
step(()=>{}, 'nothing'); step(()=>{R.stick=2;}, '2 sticks'); step(()=>{R.stone=2;}, '+2 stones'); step(()=>{R.fluff=2; rtFor('f1').items=rtFor('f1').items.filter(i=>i.type!=='fluff');}, '+2 fluff, field bare');
step(()=>{R.stick=5;}, '+3 more sticks'); step(()=>{inv.woodsword=WOOD_SWORD;}, 'sword made'); step(()=>{R.fluff=3;}, 'third fluff');
console.log('3 where Pip takes you:\\n   '+path.join('\\n   '));
// 4. on the bare field with fluff short: Pip's lines, in order
R.fluff=2; R.stick=3; inv.woodsword=0; const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip') said.push(t); return _s(t,x,y,o); };
enterScene('f1'); state.items=state.items.filter(i=>i.type!=='fluff'); state.enemies=[]; for(let k=0;k<60*40;k++){ run(1); if(k%30===0){ clear(); state.pipTalkT=Math.min(state.pipTalkT||0, state.time-7); } if(said.some(t=>/slap together/.test(t)) && !inv.woodsword){ inv.woodsword=WOOD_SWORD; } }
console.log('4 on the bare field:\\n   '+said.filter(t=>!/Still need|keep looking|what we need/.test(t)).join('\\n   '));
console.log('BUILD', BUILD, '| errs', errs);
`);
