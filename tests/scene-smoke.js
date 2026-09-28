// every scene, a few seconds of walking, swinging, throwing and pounding with its creatures awake: no errors anywhere
// (this is the test that would have caught the High Reaches freeze)
const src = require('./harness.js').src;
eval(src+`; begin(); const errsBy={}; let cur=''; const _ce=console.error; console.error=(...a)=>{ errsBy[cur]=(errsBy[cur]||0)+1; };
const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){ errsBy[cur]=(errsBy[cur]||0)+1; if(errsBy[cur]<2) console.log('ERR',cur,e.message); } }};
run(5); state.intro=null; const inv=state.inv, h=state.hero; inv.story=STORY.adventure; inv.tortoise=true; inv.sword=true; inv.fire=true; inv.acorns=20; state.pip=null;
const dirs=['arrowright','arrowup','arrowleft','arrowdown'];
for (const id of Object.keys(WORLD)) { cur=id; try { enterScene(id); } catch(e) { errsBy[id]=(errsBy[id]||0)+1; continue; }
  for (const e of state.enemies) if (e.mode==='stunned' || true) { e.mode='stunned'; e.t=0.05; }            // wake every creature from a stun: each must know how to resume
  for(let s=0;s<60*3;s++){ const d=dirs[Math.floor(s/45)%4]; for(const k of dirs) state.keys[k]=(k===d); state.keys.f=(s%40<3); state.keys.d=(s%97<2); state.keys[' ']=(s%130<2); run(1); if(state.scene!==id){ try{enterScene(id);}catch(e){} } state.cut=null; state.menu=null; if(state.texts.some(t=>t.hold)) state.texts=[]; }
  for(const k of dirs) state.keys[k]=false; }
console.log('scenes', Object.keys(WORLD).length, '| scenes with errors:', JSON.stringify(errsBy));
console.log('BUILD', BUILD, '| errs', Object.values(errsBy).reduce((a,b)=>a+b,0));`);
