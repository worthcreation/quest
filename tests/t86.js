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
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message, String(e.stack).slice(0,300));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
inv.story=STORY.gather; ['tent'].forEach(k=>rtFor('camp').flags['built_'+k]=true);
const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip') said.push(state.scene+': '+t); return _s(t,x,y,o); };
// 1. the fields: at most two tufts on the first, none lying on the second
console.log('1 fluff lying about: f1', WORLD.f1.initItems.filter(i=>i.type==='fluff').length, '| f2', (WORLD.f2.initItems||[]).filter(i=>i.type==='fluff').length, '| sticks on the glade', WORLD.start.initItems.filter(i=>i.type==='stick').length, '| craft slots at the start', newInv().craftSlots);
// 2. the wind moves fluff, and can take it off the screen
enterScene('f1'); state.enemies=[]; h.x=W*0.5; h.y=H*0.9; run(2); const tufts=state.items.filter(i=>i.type==='fluff'), start0=tufts.map(t=>[t.x,t.y]); for(let k=0;k<60*60;k++) run(1);
const moved=tufts.map((t,i)=>state.items.includes(t)? (Math.hypot(t.x-start0[i][0],t.y-start0[i][1])/UNIT).toFixed(1)+' tiles':'blown away');
console.log('2 after 60 s of wind on f1:', moved.join(', '));
// 3. no blade and short of fluff: Pip says make a wooden sword first
rawOf().stick=3; state.pipTalkT=-99; enterScene('f2'); for(let k=0;k<60*14;k++){ run(1); if(k%30===0) clear(); } console.log('3 Pip:', said.filter(s=>/sword/.test(s)).slice(0,2).join(' / '));
// 4. a rabbit dies: fluff, every time, while camp is short of it
let got=0; for(let k=0;k<20;k++){ const e={type:'rabbit'}; if(dropFor(e)==='fluff') got++; } console.log('4 rabbit drops while you still need fluff:', got+'/20');
rawOf().fluff=5; let got2=0; for(let k=0;k<200;k++){ if(dropFor({type:'rabbit'})==='fluff') got2++; } console.log('   once you have enough, it goes back to chance:', Math.round(got2/2)+'%');
console.log('BUILD', BUILD, '| errs', errs);
`);
