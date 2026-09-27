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
begin();
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,400)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
inv.story=STORY.tocamp; rtFor('meadow').flags.plots=WORLD.meadow.feat.plots.map(()=>({s:1,t:0,lv:0,seed:'turnipseed'})); enterScene('meadow'); state.enemies=[]; state.items=[]; run(20); clear();
const keys=['arrowright','arrowleft','arrowup','arrowdown'], stop=()=>keys.forEach(k=>state.keys[k]=false);
const ex=pipExit(sceneDef()), [gx,gy]=edgePoint(ex.side,(ex.a+ex.b)/2).map((v,i)=>v*(i?H:W));
// 1. walking toward the exit: Pip stays out in front, never winds around you
h.x=W*0.5; h.y=H*0.5; state.pip=null; run(5); let wind=0, lastA=null, behind=0, frames=0, flips=0, lastLane=state.pip&&state.pip.lane;
const track=()=>{ const p=state.pip; if(!p||!p.show||p.visit) return; const a=Math.atan2(p.y-h.y,p.x-h.x); if(lastA!=null){ let d=a-lastA; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; wind+=d; } lastA=a; const ux=(gx-h.x), uy=(gy-h.y), ul=Math.hypot(ux,uy)||1; if(((p.x-h.x)*ux+(p.y-h.y)*uy)/ul < 0) behind++; frames++; if(p.lane!==lastLane){ flips++; lastLane=p.lane; } };
const walk=(tx,ty,n)=>{ for(let k=0;k<n;k++){ const dx=tx-h.x, dy=ty-h.y; if(Math.hypot(dx,dy)<UNIT) break; state.keys.arrowright=dx>6; state.keys.arrowleft=dx<-6; state.keys.arrowdown=dy>6; state.keys.arrowup=dy<-6; run(1); track(); } stop(); };
walk(gx*0.5+h.x*0.5, gy*0.5+h.y*0.5, 240); for(let k=0;k<90;k++){ run(1); track(); }
console.log('1 walking toward the exit: Pip behind you', Math.round(behind/Math.max(1,frames)*100)+'% of the time | total turn around you', (wind*180/Math.PI).toFixed(0)+'deg | lane switches', flips);
// 2. zig-zag and stop-start: still no circling
wind=0; lastA=null; behind=0; frames=0; flips=0;
for(const [dx,dy] of [[-3,2],[2,2],[3,-2],[-2,-1],[4,0]]) { walk(h.x+dx*UNIT, h.y+dy*UNIT, 120); for(let k=0;k<40;k++){ run(1); track(); } }
console.log('2 wandering: total turn around you', (wind*180/Math.PI).toFixed(0)+'deg | lane switches', flips);
// 3. you sprint past Pip: he catches up along his own side, not round the front of you
state.pip.x=h.x+(gx-h.x)*0.15; state.pip.y=h.y+(gy-h.y)*0.15; run(2); wind=0; lastA=null; flips=0; lastLane=state.pip.lane;
walk(h.x+(gx-h.x)*0.6, h.y+(gy-h.y)*0.6, 200); for(let k=0;k<120;k++){ run(1); track(); }
console.log('3 ran past him: turn around you', (wind*180/Math.PI).toFixed(0)+'deg | lane switches', flips, '| he is ahead again', (()=>{ const p=state.pip, ux=gx-h.x, uy=gy-h.y; return ((p.x-h.x)*ux+(p.y-h.y)*uy) > 0; })());
// 4. Pip's bubble keeps its place beside Pip while you move about
clear(); state.pip.visit=null; const p=state.pip; say('This is a long line from Pip. It should sit still above Pip while you walk around right beside it.', p.x, p.y-UNIT*1.3, {key:'pip', color:'#bfe4ff'});
const t=state.texts.find(x=>x.key==='pip'); run(3); let maxDev=0, ref=null, shown=0;
for(const [dx,dy] of [[1.5,-1.4],[-1.5,-1.2],[0,-2],[1,1],[-1,0]]){ h.x=p.x+dx*UNIT; h.y=p.y+dy*UNIT; for(let k=0;k<10;k++){ run(1); const b=(state.textBoxes||[]).find(q=>q.t===t); if(!b) continue; shown++; const [px,py]=toScreen(p.x,p.y); const off=[b.x+b.w/2-px, b.y-py]; if(!ref) ref=off; maxDev=Math.max(maxDev, Math.hypot(off[0]-ref[0], off[1]-ref[1])); } }
console.log('4 Pip\\'s bubble with you walking all round it: shown', shown, 'of 50 frames | moved relative to Pip at most', maxDev.toFixed(1), 'px');
console.log('BUILD', BUILD, '| errs', errs);
`);
