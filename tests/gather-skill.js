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
enterScene('start'); state.enemies=[]; state.items=[]; run(5); clear(); inv.story=STORY.adventure; inv.pipTaken=true; if(state.pip) state.pip.show=false;
const table=[]; for(const L of [0,2,3,5,6,8,9,11,12]){ setSkillLevel('gather',L); table.push('L'+L+': F reach '+gatherReach().toFixed(2)+', auto common '+autoRange('stick').toFixed(1)+' / uncommon '+autoRange('thorn').toFixed(1)+' / rare '+autoRange('starpetal').toFixed(1)+' / secret '+autoRange('starseed').toFixed(1)+', ring rare '+glowShows('starpetal')+' secret '+glowShows('starseed')); }
console.log('1 by level:\\n   '+table.join('\\n   '));
// 2. level 0: standing on a stick doesn't take it; F does
setSkillLevel('gather',0); const s1={type:'stick',x:W*0.5,y:H*0.5}; state.items.push(s1); h.x=s1.x; h.y=s1.y; run(40); const stay=state.items.includes(s1); press('f'); console.log('2 level 0: stays until F', stay, '| F took it', !state.items.includes(s1));
// 3. level 3: a stick right beside you comes on its own; one 4 tiles off doesn't
setSkillLevel('gather',3); const a={type:'stick',x:h.x+UNIT*0.7,y:h.y}, b={type:'stick',x:h.x+UNIT*4,y:h.y}; state.items.push(a,b); run(60); console.log('3 level 3: beside you came', !state.items.includes(a), '| 4 tiles off stayed', state.items.includes(b)); state.items=[];
// 4. level 8: sticks 6 tiles off come; a star petal doesn't (rare needs 9) but shows its ring within reach
setSkillLevel('gather',8); const c={type:'stick',x:h.x+UNIT*6,y:h.y}, sp={type:'starpetal',x:h.x+UNIT*2,y:h.y}; state.items.push(c,sp); run(90); console.log('4 level 8: stick 6 tiles off came', !state.items.includes(c), '| star petal 2 tiles off still there', state.items.includes(sp), '| its ring shows', glowShows('starpetal'), '| in F reach', 2<gatherReach()); state.items=[];
// 5. level 12: anything on screen, even a star seed at the far side
setSkillLevel('gather',12); h.x=W*0.1; h.y=H*0.5; const far={type:'starseed',x:W*0.9,y:H*0.8}, far2={type:'ember',x:W*0.8,y:H*0.2}; state.items.push(far,far2); run(120); console.log('5 level 12: far star seed came', !state.items.includes(far), '| far ember came', !state.items.includes(far2)); state.items=[];
// 6. practice: picking things up raises it
const sk=skillOf('gather'); sk.lvl=0; sk.n=0; sk.hits=0; let n=0; while(gatherLevel()<3 && n<200){ collect({type:'stick',x:h.x,y:h.y}); gatherGain('stick'); n++; } console.log('6 pickups to reach level 3:', n); state.texts=[];
// 7. hidden spots show from level 5
rtFor('start').flags.loose=null; const sp0=looseSpots(); setSkillLevel('gather',4); draw(); setSkillLevel('gather',7); draw(); console.log('7 hidden loose spots on this screen:', sp0.length, '(drawn faintly from level 5)');
console.log('BUILD', BUILD, '| errs', errs);
`);
