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
begin();
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const said=()=>state.texts.filter(t=>t.key==='pip'||t.key==='npc').map(t=>t.text);
const log=[]; const _say=say; say=function(text,x,y,o){ if(o&&(o.key==='pip')) { const v=state.pip&&state.pip.visit; log.push(state.scene+': '+text+(v?'   [Pip '+(Math.hypot(state.pip.x-v.x,state.pip.y-v.y)/UNIT).toFixed(1)+' tiles from it]':'')); } return _say(text,x,y,o); };
run(60*7);
const h=()=>state.hero, p=()=>state.pip;
console.log('after intro: pip following', !!(p()&&p().follow&&p().show), 'cut', state.cut);
run(60*4); const walkTo=(x,y,n=240)=>{ for(let k=0;k<n;k++){ const dx=x-h().x, dy=y-h().y; if(Math.hypot(dx,dy)<UNIT*0.5) break; state.keys.arrowright=dx>6; state.keys.arrowleft=dx<-6; state.keys.arrowdown=dy>6; state.keys.arrowup=dy<-6; run(1);} ['arrowright','arrowleft','arrowdown','arrowup'].forEach(k=>state.keys[k]=false); };
const b=WORLD.camp.feat.bench; walkTo(b[0]*W, b[1]*H+UNIT*1.5); run(60*4);
const pl=WORLD.camp.feat.plots[0]; walkTo(pl[0]*W, pl[1]*H+UNIT); run(60*4);
// walk south to the glade; pip should come along and keep near
walkTo(W*0.5, H-UNIT*0.3, 400); state.keys.arrowdown=true; run(10); state.keys.arrowdown=false; run(60); if (state.scene!=='start') { enterScene('start', 0.5, 0.05); run(30); }
console.log('scene', state.scene, 'pip here', !!(p()&&p().show), 'pip distance tiles', (Math.hypot(p().x-h().x,p().y-h().y)/UNIT).toFixed(1));
run(60*5);
const rock=WORLD.start.pullables.find(r=>r.id==='rock'); walkTo(rock.fx*W-UNIT*1.2, rock.fy*H); run(60*4);
// free the rock and carry it
state.carry='rock'; state.carryT=state.time; RT.start.pulled.add('rock'); run(60*4);
// break the thicket
const th=WORLD.start.solids.find(s=>s.bar==='thicket'); RT.start.flags.thicket=true; refreshSceneGeometry(); state.carry=null; run(60*4); run(60*4);
// pip's max distance while you run around the glade
let maxd=0; for (let k=0;k<6;k++){ walkTo(W*(0.2+0.12*k), H*(k%2?0.3:0.7), 120); maxd=Math.max(maxd, Math.hypot(p().x-h().x,p().y-h().y)/UNIT); }
console.log('pip stays within', maxd.toFixed(1), 'tiles while you run around');
// the woods: w1 then w2; the abduction happens when the w2 gate opens
enterScene('meadow', 0.95, 0.5); run(30); if (state.bird) walkTo(state.bird.x+UNIT*3, state.bird.y+UNIT*2, 300); run(60*6); enterScene('w1', 0.05, 0.5); run(30); { const pl=WORLD.w1.feat.plates[0]; walkTo(pl.fx*W-UNIT*3, pl.fy*H, 300); } run(60*6); state.plateOn.p1=true; run(60*4);
enterScene('w2', 0.05, 0.5); run(30); { const pl=WORLD.w2.feat.plates[0]; walkTo(pl.fx*W-UNIT*4, pl.fy*H, 300); } run(60*6); console.log('in w2, pip still with you', pipWithYou());
state.plateOn.p2=true; run(3); console.log('gate opens -> cut', state.cut&&state.cut.type); run(60*6);
console.log('pip taken', state.inv.pipTaken, 'title', state.title&&state.title.text);
enterScene('w3', 0.05, 0.5); run(30); console.log('w3 glimpse of Pip into the sinkhole', !!state.glimpse);
console.log('--- what Pip said, in order ---'); log.forEach(l=>console.log('  '+l));
console.log('errs', errs2);
`);