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
begin();
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,400)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
run(10); const introHeld=state.texts.some(t=>t.hold); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
console.log('1 the jetty opening waits for F:', introHeld);
// 2. in the meadow, idle with no seeds: reminders, each different, from different spots
enterScene('meadow'); run(10); clear(); { const hp=hollowPoint(); h.x = hp[0] < W/2 ? W*0.9 : W*0.1; h.y = H*0.15; } const said=[], spots=[];
const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip'){ said.push({t, held:o.hold!==false && PIP_HOLD.has('x')}); spots.push([Math.round(state.pip.x/UNIT),Math.round(state.pip.y/UNIT)]); } return _s(t,x,y,o); };
for(let k=0;k<60*120;k++) run(1);
const rem=said.map(s=>s.t); console.log('2 two idle minutes in the garden, Pip said:\\n   '+rem.join('\\n   '));
let reps=0; for(let i=1;i<rem.length;i++) if(rem[i]===rem[i-1]) reps++; console.log('   same line twice in a row:', reps, '| distinct lines', new Set(rem).size, 'of', rem.length, '| Pip spoke from', new Set(spots.map(s=>s.join(','))).size, 'different spots');
console.log('   any of it waiting on F:', state.texts.some(t=>t.key==='pip'&&t.hold));
// 3. waiting vs free bubbles look different
state.texts=[]; say('A free line.', state.pip.x, state.pip.y-UNIT*1.3, {key:'pip', hold:false, color:'#bfe4ff'}); say('A waiting line.', h.x, h.y-UNIT*2, {key:'npc', color:'#fdf6e3'}); run(20);
const fr=state.texts.find(t=>t.text==='A free line.'), wt=state.texts.find(t=>t.text==='A waiting line.'); console.log('3 free line waits?', !!(fr&&fr.hold), '| waiting line waits?', !!(wt&&wt.hold), '(drawn: solid, edged, badge vs light, edgeless, italic)');
// 4. names
console.log('4 stones are', RAW.stone, '| charm', WEAR.stonecharm.name, '| gather step', QUESTS.find(q=>q.id==='camp').steps[0].line().slice(0,24));
console.log('BUILD', BUILD, '| errs', errs);
`);
