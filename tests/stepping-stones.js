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
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const setMV = v => { state.inv.depth=0; state.inv.tlevel=0; state.inv.vigBonus=v-8; state.hero.vig=maxVig(); };
// cross by real jumps: from each stone, face the next with the arrow keys and jump
function crossFord(tired) {
  enterScene('ford'); state.cut=null; const h=state.hero, S=WORLD.ford.river.stones; state.texts=[];
  h.x=S[0][0]*W - (S[0][0]*W - S[0][0]*W); h.y=H*(0.5+WORLD.ford.river.wH/2)+UNIT*0.4; h.x=S[0][0]*W; run(2);
  if (tired) h.vig=Math.max(1.5, maxVig()*0.2);
  const targets=S.map(s=>[s[0]*W,s[1]*H]).concat([[S[S.length-1][0]*W, H*0.03]]);
  for (const [tx,ty] of targets) {
    const dx=tx-h.x, dy=ty-h.y; const ux=Math.abs(dx)>UNIT*0.5?Math.sign(dx):0, uy=Math.abs(dy)>UNIT*0.5?Math.sign(dy):0;
    state.keys.arrowright=ux>0; state.keys.arrowleft=ux<0; state.keys.arrowdown=uy>0; state.keys.arrowup=uy<0;
    state.keys[' ']=true; run(1); state.keys[' ']=false;
    for (let k=0;k<90;k++){ run(1); if (h.falling>0) break; if (h.z<=0 && k>2) break; }
    ['arrowright','arrowleft','arrowdown','arrowup'].forEach(k=>state.keys[k]=false); run(3);
    if (h.falling>0) return 'fell at stone '+targets.indexOf(targets.find(t=>t[0]===tx&&t[1]===ty));
  }
  run(5); return state.scene==='farbank' || h.y < H*(0.5-WORLD.ford.river.wH/2) ? 'made it' : 'stuck at y '+(h.y/H).toFixed(2);
}
const shapes=[[1280,800],[390,844],[844,390]];
for (const [w,hh] of shapes) { window.innerWidth=w; window.innerHeight=hh; resize();
  for (const seed of [1412347, 6434191, 7919, 104729]) { resetRun(seed); state.cut=null; setMV(8);
    const r1=crossFord(false); setMV(8); const r2=crossFord(true);
    const S=WORLD.ford.river.stones; const steps=S.slice(1).map((s,i)=>Math.hypot((s[0]-S[i][0])*W,(s[1]-S[i][1])*H)/UNIT);
    console.log(w+'x'+hh, 'seed', seed, 'stones', S.length, 'hop', Math.min(...steps).toFixed(2)+'-'+Math.max(...steps).toFixed(2), 'tiles | fresh:', r1, '| tired:', r2);
  }
}
window.innerWidth=1280; window.innerHeight=800; resize(); resetRun(1412347); state.cut=null;
// walking stone to stone still drops you in
enterScene('ford'); const S=WORLD.ford.river.stones, h=state.hero; h.x=S[0][0]*W; h.y=S[0][1]*H; run(2);
for (let k=0;k<60;k++){ const dx=S[1][0]*W-h.x, dy=S[1][1]*H-h.y; state.keys.arrowright=dx>4; state.keys.arrowleft=dx<-4; state.keys.arrowup=dy<-4; state.keys.arrowdown=dy>4; run(1); if (h.falling>0) break; }
['arrowright','arrowleft','arrowdown','arrowup'].forEach(k=>state.keys[k]=false); console.log('walking between stones falls in', h.falling>0); run(80);
// patterns differ by seed
const pat = seed => { resetRun(seed); enterScene('ford'); return WORLD.ford.river.stones.map(s=>s[0].toFixed(2)).join(','); };
console.log('patterns differ', pat(1412347)!==pat(6434191), 'same seed same pattern', pat(7919)===pat(7919));
// the action shine
resetRun(1412347); state.cut=null; state.inv.pipSaved=true; enterScene('camp'); state.cut=null; const b=WORLD.camp.feat.bench; state.hero.x=b[0]*W; state.hero.y=b[1]*H+UNIT*1.3; run(3);
console.log('near bench:', state.actionHint && state.actionHint.verb, '| label drawn', !!state.hintRect, '| old prompt text shown', state.texts.some(t=>/to work at the bench/.test(t.text)));
state.settings.labels=false; state.hintRect=null; run(3); console.log('labels off: shine still', !!state.actionHint, 'label drawn', !!state.hintRect); state.settings.labels=true;
const pipN=WORLD.camp.npcs.find(n=>npcHere(n)); if (pipN){ const [x,y]=npcPos(pipN); state.hero.x=x-UNIT*1.2; state.hero.y=y; run(3); console.log('near Pip:', state.actionHint && state.actionHint.verb); }
state.hero.x=W*0.5; state.hero.y=H*0.9; run(3); console.log('nothing near:', state.actionHint);
toggleMenu(); state.menu.tab=SYS_TAB(); console.log('system has', SYSTEM_ITEMS().map(o=>o[1]).filter(x=>/label/.test(x)).join()); toggleMenu();
console.log('errs', errs2);
`);