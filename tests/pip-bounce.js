const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
// 1. bounces during the opening
run(3); let air=0, hops=0, was=false, top=0; for(let k=0;k<60*15;k++){ run(1); const b=state.pip.bz||0; if(b>0) air++; if(b>0&&!was) hops++; was=b>0; top=Math.max(top,b/UNIT); }
console.log('1 15 s of Pip talking: hops', hops, '| off the ground', Math.round(air/9)+'% of the time | highest', top.toFixed(2), 'tiles');
for(let i=0;i<3;i++){ press('f'); run(30);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
// 2. in the garden: the robin line goes as soon as you have seeds
h.x=W*0.5; h.y=H-UNIT*0.6; run(2); state.keys.arrowdown=true; run(90); state.keys.arrowdown=false; run(60*3);
const line=state.texts.find(t=>t.key==='pip'); console.log('2 Pip says:', line&&line.text);
collect({type:'turnipseed', x:h.x, y:h.y}); let gone=null; for(let k=0;k<120;k++){ run(1); if(line && !state.texts.includes(line) && gone==null) gone=k/60; }
console.log('   you picked up seeds: that line was gone after', gone==null?'still there':gone.toFixed(2)+' s', '| now:', (state.texts.find(t=>t.key==='pip')||{}).text||'(nothing yet)');
console.log('BUILD', BUILD, '| errs', errs);
`);
