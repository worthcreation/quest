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
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
state.texts=[]; state.title=null;
say('Tap F to slash. Hold and release to stab.', null, null, { key:'tip', tip:'sword' });
console.log('tip shown in world', state.texts.length, '| in menu pool', (state.tipPool||[]).includes('Tap F to slash. Hold and release to stab.'));
say('F to cast', W*0.5, H*0.5, { key:'fish' }); run(10); console.log('prompt drawn as badge', state.textBoxes.map(b=>b.t.badge||b.t.text).join(' | '));
state.texts=[];
say('Pip: look at that!', W*0.4, H*0.4, { key:'pip', life: 4 }); say('A giant mushroom, glowing faintly.', W*0.6, H*0.6, { key:'shroom', life: 4 }); say('+1 driftwood (3)', W*0.3, H*0.6, { key:'mat', color:'#ffe38a', life: 4 });
showTitle('The Deep Woods', null, 'area', 2.8); run(10);
console.log('while Pip talks: shown', state.textBoxes.map(b=>b.t.text).join(' | '), '| title up', !!state.title, 'queued', (state.titleQ||[]).length);
run(60*4); console.log('after Pip stops: title', state.title && state.title.text);
// the menu marquee
toggleMenu(); run(5); console.log('marquee tip', JSON.stringify(state.marquee && state.marquee.text)); run(60*20); console.log('next marquee tip', JSON.stringify(state.marquee.text)); toggleMenu();
// words on screen during the opening, before vs now: count the average visible words per frame
state.inv.pipTips={}; enterScene('camp'); state.cut=null; let words=0, frames=0; const rd=draw; draw=function(){ rd(); frames++; words += (state.textBoxes||[]).reduce((a,b)=>a+b.t.text.split(' ').length,0) + (state.title? (state.title.text+' '+(state.title.sub||'')).split(' ').length:0); };
for (const id of ['camp','start','meadow','w1']) { enterScene(id, 0.5, 0.5); state.cut=null; run(60*6); }
draw=rd; console.log('average words on screen per frame', (words/frames).toFixed(1));
console.log('errs', errs2);
`);