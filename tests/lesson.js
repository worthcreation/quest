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
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message, String(e.stack).slice(0,200));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<20 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
const h=state.hero, inv=state.inv, R=rawOf(); inv.story=STORY.gather; rtFor('camp').flags.built_tent=true;
const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&(o.key==='pip'||o.who==='pip')) said.push(t); return _s(t,x,y,o); };
// 1. gathering sticks and stones: no crafting talk
enterScene('start'); for(let k=0;k<60*20;k++){ run(1); if(k%40===0) clear(); } R.stick=4; R.stone=2; enterScene('riverbank'); for(let k=0;k<60*15;k++){ run(1); if(k%40===0) clear(); }
console.log('1 before any fluff, Pip mentions crafting:', said.some(t=>/craft|Craft|combine|Combine/.test(t)));
// 2. two tufts: the lesson, pages you read with F
enterScene('f1'); state.items=state.items.filter(i=>i.type!=='fluff'); R.fluff=2; said.length=0; for(let k=0;k<60*4;k++) run(1);
const LS=state.texts.find(t=>t.who==='pip'&&t.hold); const pages=[]; if(LS){ pages.push(LS.text); for(let i=0;i<8 && state.texts.includes(LS);i++){ press('f'); if(state.texts.includes(LS) && LS.text!==pages[pages.length-1]) pages.push(LS.text); } }
console.log('2 the lesson, one page at a time (waits for F):\\n   '+pages.join('\\n   '));
console.log('   the wooden sword recipe is known now:', !!(inv.heard||{}).woodsword);
// 3. the feather
R.fluff=3; R.stick=2; R.stone=0; R.firering=0; ['fire','bench'].forEach(k=>rtFor('camp').flags['built_'+k]=true); said.length=0; enterScene('camp'); for(let k=0;k<60*3;k++) run(1);
const fl=state.texts.find(t=>/feather/.test(t.text)); console.log('3 at home base:', fl&&fl.text, '| waits for F', !!(fl&&fl.hold), '| feather yet', gearOwned().includes('feather'));
clear(); for(let k=0;k<60*3;k++) run(1); console.log('   after reading it: feather', gearOwned().includes('feather'), '| worn', wears('feather'));
for(let k=0;k<60*25 && !(state.cut&&state.cut.type==='dusk');k++){ run(1); if(k%30===0) clear(); } console.log('   dusk comes after:', !!(state.cut&&state.cut.type==='dusk'));
// 4. the lantern: picked up in the tent, then the light and the lantern on you
for(let k=0;k<60*20 && state.cut;k++){ run(1); if(k%30===0) clear(); } console.log('4 after dusk: cut', state.cut&&state.cut.type, state.cut&&state.cut.t.toFixed(1), 'held', state.texts.filter(t=>t.hold).map(t=>t.text.slice(0,30)), '| in', state.scene, '| lantern already?', !!inv.lantern, '| a lantern lies here', state.items.some(i=>i.type==='lantern'));
const lt=state.items.find(i=>i.type==='lantern'); if(lt){ h.x=lt.x; h.y=lt.y; run(3); clear(); press('f'); run(10); } console.log('   picked up:', !!inv.lantern);
console.log('BUILD', BUILD, '| errs', errs);
`);
