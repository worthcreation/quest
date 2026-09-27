const src = require('./harness.js').src;
eval(src+`;
begin();
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,400)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
enterScene('start'); state.enemies=[]; run(5); clear();
// 1. the vigor bar grows to one layer of 17, then layers stack over it
const bar=(bonus)=>{ inv.vigBonus=bonus; h.vig=maxVig(); draw(); const b=state.vigorBar; return { mv:maxVig(), w:+(b.w/b.rowW).toFixed(2), fills:b.fills, centred: Math.abs((b.x+b.w/2)-(b.rowX+b.rowW/2))<0.5 }; };
console.log('1 bar:', JSON.stringify([bar(0), bar(9), bar(20), bar(40)]));
const LC=i=>{ const k=1-Math.pow(0.55,i); return [Math.round(226-200*k),Math.round(250-160*k),Math.round(210-180*k),+(0.88+0.12*k).toFixed(2)]; };
console.log('2 layer colours 1..5 (lighter to darker, more solid):', [0,1,2,3,4].map(i=>'rgb('+LC(i).slice(0,3)+') a'+LC(i)[3]).join(' | '));
console.log('3 vigor needed for each depth:', [0,1,2,3,4,5].map(d=>baseVig(d)).join(', '), '| gaps', [1,2,3,4,5].map(d=>baseVig(d)-baseVig(d-1)).join(', '));
inv.vigBonus=0;
// 4. sparkles: sparse, mostly faint and tiny, rarely two at once, never twice in the same spot
const probe=(dist)=>{ const it={type:'stick', x:W*0.6, y:H*0.5}; state.items.push(it); h.x=it.x-dist*UNIT; h.y=it.y; const seen=new Set(); let maxAt=0, big=0, small=0, faint=0, close=0, prev=null;
  for(let k=0;k<60*20;k++){ run(1); const G=GLINTS.get(it); if(!G) continue; maxAt=Math.max(maxAt,G.gl.length); for(const g of G.gl) if(!seen.has(g)){ seen.add(g); if(g.r>UNIT*0.1) big++; else small++; if(g.a<0.36) faint++; if(prev && Math.hypot(g.dx-prev.dx,g.dy-prev.dy)<UNIT*0.2) close++; prev=g; } }
  state.items.splice(state.items.indexOf(it),1); return { per10s: +(seen.size/2).toFixed(1), maxAtOnce:maxAt, smallShare: seen.size? Math.round(small/seen.size*100)+'%':'-', faintShare: seen.size? Math.round(faint/seen.size*100)+'%':'-', sameSpotRepeats: close }; };
console.log('4 sparkles, 20 s each: far', JSON.stringify(probe(9)), '\\n   near', JSON.stringify(probe(3)), '\\n   in reach', JSON.stringify(probe(0.6)));
// 5. banners: drawn once to their own canvas, themed by region; quest complete uses the same banner
showTitle('Set up camp','a new quest','herald',3.6); run(1); const T=state.title, img=T.img; run(60); console.log('5 new quest banner: cached image', !!img, '| same image a second later', state.title&&state.title.img===img, '| region', regionOf(sceneDef()));
console.log('   regions of every place so far:', [...new Set(Object.values(WORLD).map(regionOf))].join(','));
state.title=null; state.titleQ=[]; state.qDone=[];
QUESTS.forEach(q=>{ if(q.id==='garden'){} }); showTitle("Pip's garden",'quest complete','herald',3.6,true); run(60*5); console.log('6 quest complete banner held until F:', !!(state.title&&state.title.hold)); press('f'); run(40); const fading=state.title&&state.title.t; run(60*1.3); console.log('   F: it fades out over about a second, then gone', !state.title);
console.log('BUILD', BUILD, '| errs', errs);
`);
