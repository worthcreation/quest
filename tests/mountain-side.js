const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }};
run(5); state.intro=null; state.texts=[]; const inv=state.inv, h=state.hero; inv.story=STORY.gather; state.pip=null;
let out=[];
for (const id of ['f3','f4','f5']) { const sc=WORLD[id], c=sc.corridor; enterScene(id); state.enemies=[]; run(3);
  const isl=(c.islands||[])[0]; if (!isl) { out.push(id+': no island'); continue; }
  const [a,b]=corridorSpan(sc,isl.fy), drop=c.rock==='L'?1:-1, edge=(drop>0?b:a)*W;
  // walk off the edge: you fall
  h.x=edge-drop*UNIT*0.6; h.y=isl.fy*H - UNIT*1.6; h.z=0; h.falling=0; const k=drop>0?'arrowright':'arrowleft'; state.keys[k]=true; let fell=false; for(let q=0;q<40;q++){ run(1); if(h.falling>0) { fell=true; break; } } state.keys[k]=false; run(90);
  // jump to the island: you land on it
  h.x=edge-drop*UNIT*0.5; h.y=isl.fy*H; h.z=0; h.falling=0; h.fx=drop; h.fy=0; run(2); state.keys[k]=true; run(2); state.keys[' ']=true; run(2); state.keys[' ']=false; run(26); state.keys[k]=false; run(40);
  const onIt=onIsland(sc, h.x/W, h.y/H) && !(h.falling>0); if(!onIt) out.push('   dbg '+id+' island '+(isl.fx*W/UNIT).toFixed(1)+','+(isl.fy*H/UNIT).toFixed(1)+' rx '+(isl.rx*W/UNIT).toFixed(1)+' edge '+(edge/UNIT).toFixed(1)+' hero '+(h.x/UNIT).toFixed(1)+','+(h.y/UNIT).toFixed(1)+' falling '+h.falling);
  // the rock side stops you
  const rockX=(c.rock==='L'?a:b)*W; h.x=rockX+drop*UNIT*0.8; h.y=isl.fy*H; const kk=c.rock==='L'?'arrowleft':'arrowright'; state.keys[kk]=true; run(40); state.keys[kk]=false; const held=c.rock==='L'? h.x>=rockX : h.x<=rockX;
  out.push(id+' rock '+c.rock+': walk off the drop edge -> fell '+fell+' | jump to the island -> on it '+onIt+' | rock side holds '+held); }
console.log(out.join('\\n'));
console.log('BUILD', BUILD, '| errs', errs);
`);
