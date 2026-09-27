const src = require('./harness.js').src;
eval(src+`;
begin(); const run=n=>{for(let k=0;k<n;k++){update(1/60);draw();}};
const rate=(story)=>{ let d=0; const N=2000; state.inv.story=story; state.inv.firstBirdSeed=true; for(let i=0;i<N;i++){ state.items=[]; state.bird={x:W*0.5,y:H*0.5,mode:'perch',vx:0,vy:0}; scareBird(W*0.5,H*0.5,2); if(state.items.some(it=>it.type==='turnipseed')) d++; } return Math.round(d/N*100); };
console.log('robin seed drop after the first: garden lesson', rate(STORY.garden)+'%', '| afterwards', rate(STORY.gather)+'%');
console.log('BUILD', BUILD);
`);
