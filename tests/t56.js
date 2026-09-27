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
const clearHeld=()=>{ for(let i=0;i<8 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++){ state.keys.f=true; run(1); state.keys.f=false; run(4);} };
const press=(k,n=1)=>{ if(k==='f') clearHeld(); state.keys[k]=true; run(n); state.keys[k]=false; run(2); };   // build 65: F reads held text first
const log=[]; const _say=say; say=function(text,x,y,o){ if(o&&(o.key==='pip'||o.key==='npc')) log.push(state.scene+': '+text); return _say(text,x,y,o); };
let h=state.hero;
run(5); console.log('opens in', state.scene, '| on the old jetty', !!sceneDef().feat.oldJetty, '| intro', !!state.intro, '| can steer?', true);
// you can move during the talk
run(30); const hx=state.hero.x; state.keys.arrowleft=true; run(20); state.keys.arrowleft=false; console.log('during the talk, pressing left moved you', Math.abs(state.hero.x-hx) < UNIT*0.3 ? 'no' : 'yes', '| scene', state.scene);
// build 65 opening: read Pip's three lines with F, wait for Pip to head south, walk out the south edge, clear the quest alert
const opening=()=>{ run(20); for(let i=0;i<3;i++){ press('f'); run(25);} for(let k=0;k<60*14 && state.intro;k++) run(1); if(state.title&&state.title.hold) press('f'); const hh=state.hero; hh.x=W*0.5; hh.y=H-UNIT*0.6; run(3); state.keys.arrowdown=true; run(90); state.keys.arrowdown=false; run(40); };
opening();
h=state.hero; console.log('control back in', state.scene, '| turnip seeds', state.inv.bag.turnipseed, '| story', state.inv.story); state.inv.bag.turnipseed=3;  // the lesson's seeds, handed over for the camp test
// plant the three seeds
const plots=WORLD.meadow.feat.plots; for (const q of plots) { h.x=q[0]*W; h.y=q[1]*H; run(3); const before=state.inv.bag.turnipseed; while(state.texts.some(t=>t.hold)){press('f');run(4);} press('d'); run(20); console.log('  plot', q.map(v=>v.toFixed(2)).join(','), 'planted?', state.inv.bag.turnipseed<before, 'cut', !!state.cut, 'menu', !!state.menu, 'npcTalk', !!state.npcTalk); }
run(60*6); console.log('planted', (rtFor('meadow').flags.plots||[]).filter(p=>p.s===1).length, '| story', state.inv.story, '| Pip heading for', pipExit(WORLD.meadow) && pipExit(WORLD.meadow).to);
// follow Pip to camp
enterScene('start', 0.04, 0.5); run(30); console.log('in the glade Pip heads for', pipExit(WORLD.start) && pipExit(WORLD.start).to);
enterScene('camp', 0.5, 0.94); run(60*4); console.log('camp: tent', campBuilt('tent'), 'fire', campBuilt('fire'), 'bench', campBuilt('bench'), '| story', state.inv.story);
run(60*12);
// the tent: enter, nap, chest, book
h=state.hero; const td=WORLD.camp.feat.tentDoor; h.x=td[0]*W; h.y=td[1]*H+UNIT*0.3; run(3); const hint=state.actionHint&&state.actionHint.verb; press('f'); run(40); console.log('tent door label', hint, '-> in', state.scene);
h=state.hero; const ch=WORLD.tentin.feat.chest; h.x=ch[0]*W; h.y=ch[1]*H+UNIT*0.9; run(3); state.inv.acorns=5; press('f'); console.log('chest opens', state.menu && state.menu.view); const before=state.inv.acorns; state.menu.col=0; state.menu.sel=stashList(packAsStash()).findIndex(e=>e.cat==='acorns'); press('f'); console.log('stored an acorn', before-state.inv.acorns===1, 'chest has', state.inv.chest.acorns); state.menu.col=1; state.menu.sel=0; press('f'); console.log('took it back', state.inv.acorns===before); state.menu=null;
const bk=WORLD.tentin.feat.book; h.x=bk[0]*W; h.y=bk[1]*H+UNIT*0.9; run(3); press('f'); console.log('book opens', state.menu && state.menu.view, '| page 1:', BOOK[0].title); press('arrowright'); console.log('turned to', BOOK[state.menu.page].title); state.menu=null;
h.x=W*0.5; h.y=H-UNIT*0.6; state.keys.arrowdown=true; run(6); state.keys.arrowdown=false; run(40); console.log('out the flap ->', state.scene);
// gather: stones by the water, sticks in the forest, fluff in the windy field
for (const id of ['riverbank','start','f1','f2']) { enterScene(id); run(20); h=state.hero; for (const it of state.items.filter(i=>['stone','stick','fluff'].includes(i.type))) { h.x=it.x; h.y=it.y; run(3); } run(60*3); }
console.log('gathered', JSON.stringify(rawOf()));
// craft and build
enterScene('camp'); run(10); toggleMenu(); state.menu.tab=PACK_TABS.indexOf('Craft'); state.menu.focus='grid';
const putOn = k => { const cells=craftCells(); state.menu.sel=cells.findIndex(c=>c.raw===k); press('f'); };
const combine = () => { state.menu.sel=0; press('f'); };
putOn('fluff'); putOn('fluff'); combine(); console.log('glue', rawOf().glue, '| slots', state.inv.craftSlots);
putOn('stone'); putOn('stone'); putOn('stick'); combine(); putOn('stick'); putOn('stick'); putOn('glue'); combine(); console.log('fire ring', rawOf().firering, 'workbench', rawOf().benchkit); toggleMenu();
h=state.hero; for (const b of WORLD.camp.feat.buildSpots) { h.x=b.fx*W; h.y=b.fy*H+UNIT*(b.r+0.5); run(3); press('f'); run(60); }
run(60*5); console.log('camp done', campDone(), '| story', state.inv.story, '| Pip now heads for', pipExit(WORLD.camp) && pipExit(WORLD.camp).to);
console.log('--- what Pip said ---'); log.forEach(l=>console.log('  '+l));
console.log('errs', errs2);
`);