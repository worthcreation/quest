const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }};
run(5); state.intro=null; state.texts=[]; const inv=state.inv, h=state.hero; state.pip=null;
// 1. the glade: a few sticks, well apart; a couple by trees
const st=WORLD.start.initItems.filter(i=>i.type==='stick'); let minD=1e9; for(let a=0;a<st.length;a++) for(let b=a+1;b<st.length;b++) minD=Math.min(minD, Math.hypot((st[a].fx-st[b].fx)*W,(st[a].fy-st[b].fy)*H)/UNIT);
console.log('1 sticks lying in the glade:', st.length, '| closest two are', minD.toFixed(1), 'tiles apart');
// 2. pound by a tree while camp needs sticks: down they come
inv.story=STORY.gather; enterScene('start'); state.enemies=[]; run(3); state.items=state.items.filter(i=>i.type!=='stick'); const tr=state.solids.find(s=>s.kind==='tree' && s.x>UNIT*3 && s.x<W-UNIT*3 && s.y>UNIT*3 && s.y<H-UNIT*3);
h.x=tr.x+tr.r+UNIT*0.8; h.y=tr.y+UNIT*0.5; run(3); state.keys[' ']=true; run(1); state.keys[' ']=false; run(8); state.keys.f=true; run(1); state.keys.f=false; run(40);
console.log('2 a pound by a tree brought down sticks:', state.items.filter(i=>i.type==='stick').length);
// 3. the stuck stone by the river: nothing until Pip has shown you
enterScene('riverbank'); state.enemies=[]; run(3); const rk=WORLD.riverbank.feat.riverRock; h.x=rk[0]*W-UNIT*1.2; h.y=rk[1]*H; h.fx=1; run(3); state.keys[' ']=true; run(1); state.keys[' ']=false; run(8); state.keys.f=true; run(1); state.keys.f=false; run(40);
const before=!!rtFor('riverbank').flags.knocked_riverrock; (inv.pipTips=inv.pipTips||{})['stone-loosen']=true; h.x=rk[0]*W-UNIT*1.2; h.y=rk[1]*H; run(3); state.keys[' ']=true; run(1); state.keys[' ']=false; run(8); state.keys.f=true; run(1); state.keys.f=false; run(40);
console.log('3 river stone before Pip: loosened', before, '| after Pip shows you:', !!rtFor('riverbank').flags.knocked_riverrock);
console.log('BUILD', BUILD, '| errs', errs);
`);
