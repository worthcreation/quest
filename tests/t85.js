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
// 1. the book's first rule has a carrot
console.log('1 rule 1 doodle:', BOOK_PAGES()[0].bits[0][0], '| eat something:', BOOK_PAGES()[5].bits[2][0]);
// 2. Pip at his garden post never stands still
enterScene('meadow'); run(20); clear(); h.x=W*0.1; h.y=H*0.15; let still=0, n=0, lp=null; for(let k=0;k<60*10;k++){ run(1); const p=state.pip; if(lp){ n++; if(Math.hypot(p.x-lp[0],p.y-lp[1])<0.05) still++; } lp=[p.x,p.y]; }
console.log('2 garden post, 10 s: Pip still', Math.round(still/n*100)+'% of frames');
// 3. pulling crops: hold F, quicker with farming
const q=WORLD.meadow.feat.plots[0], rt=rtFor('meadow'); rt.flags.plots=rt.flags.plots||WORLD.meadow.feat.plots.map(()=>({s:0,t:0,lv:0}));
const pullTime=(lvl)=>{ inv.cropXp={turnip:lvl*6}; rt.flags.plots[0]={s:1,t:state.playTime-999,lv:0,seed:'turnipseed'}; h.x=q[0]*W; h.y=q[1]*H; run(3); clear(); const f0=inv.food.length; state.keys.f=true; let k=0; for(;k<180 && inv.food.length===f0;k++) run(1); state.keys.f=false; run(2); return [(k/60).toFixed(2), inv.food.length-f0]; };
const tap=(()=>{ rt.flags.plots[0]={s:1,t:state.playTime-999,lv:0,seed:'turnipseed'}; h.x=q[0]*W; h.y=q[1]*H; run(3); const f0=inv.food.length; press('f'); run(3); return inv.food.length-f0; })();
console.log('3 a quick tap of F on a ripe turnip pulls it:', tap>0, '| hold time to pull, by farming level:', [0,1,2,4].map(l=>'L'+l+' '+pullTime(l)[0]+'s').join(', '));
console.log('   hint says:', (state.hintActs||[]).map(a=>a.verb).join(', ')||'(after harvest)', '| CROP_PULL by level', CROP_PULL.join(', '));
// 4. heading for camp, you stand still: Pip goes on ahead, leaves the screen, comes back to hurry you
inv.story=STORY.tocamp; enterScene('meadow'); run(10); clear(); const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip') said.push(Math.round(state.time)+'s '+t); return _s(t,x,y,o); };
const t0=state.time; let left=null, back=null; for(let k=0;k<60*40;k++){ run(1); const p=state.pip, off=p.x<-UNIT||p.x>W+UNIT||p.y<-UNIT||p.y>H+UNIT; if(off&&left==null) left=state.time-t0; if(left!=null&&!off&&back==null&&p.lead&&p.lead.phase==='back') back=state.time-t0; }
console.log('4 you wait: Pip left the screen after', left==null?'-':left.toFixed(1)+' s', '| came back after', back==null?'-':back.toFixed(1)+' s');
console.log('   he said:', said.join(' / '));
console.log('BUILD', BUILD, '| errs', errs);
`);
