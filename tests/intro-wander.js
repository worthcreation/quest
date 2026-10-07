const src = require('./harness.js').drawn;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
run(5); const p=state.pip, pts=[]; let moved=0, lp=[p.x,p.y], inRiver=0;
for(let k=0;k<60*12;k++){ run(1); moved+=Math.hypot(p.x-lp[0],p.y-lp[1])/UNIT; lp=[p.x,p.y]; if(isChasm(p.x,p.y)) inRiver++; if(k%60===0) pts.push((p.x/UNIT).toFixed(1)+','+(p.y/UNIT).toFixed(1)); }
const b=(state.textBoxes||[]).find(q=>q.t.key==='npc'), [px]=toScreen(p.x,p.y);
console.log('1 12 s of the opening, still on line 1:', !!state.texts.find(t=>t.hold), '| Pip walked', moved.toFixed(1), 'tiles | spots:', pts.slice(0,8).join(' '), '| in the river', inRiver, 'frames');
console.log('   his words ride with him:', b? Math.abs(b.x+b.w/2-px)<b.w/2+2 : 'n/a');
for(let i=0;i<6 && state.intro && !state.intro.gone;i++){ press('f'); if (state.intro && !state.intro.gone) run(40); } const t0=state.time; for(let k=0;k<60*12 && state.intro;k++) run(1);
console.log('2 after the last line Pip ran off south in', (state.time-t0).toFixed(1), 's');
console.log('BUILD', BUILD, '| errs', errs);
`);
