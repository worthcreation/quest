global.location = { search: '?edit=flat&seed=1000003' };
const src = require('./harness.js').src;
// Build 217 (Ross, from a screenshot of the editor): an overhang clear of your head is walked under, the x-ray showing
// you through it; a plate laid partly inside another is painted by whose foot lies south where they overlap, so the
// one in front shows over the other's wall. Laid on the flat board through the editor's loader, then played.
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\n').slice(1,3).join(' | '));} }};
const h=state.hero, m=MTN.flat, E=state.edit, pl=()=>platesLay(m), tx=()=>h.x/UNIT, lift=()=>+(h.lift||0).toFixed(2), off=()=>['arrowleft','arrowright','arrowup','arrowdown'].forEach(k=>state.keys[k]=false);
run(5); state.texts=[];
const pt=(x,y,w,hh,seed,base,thick)=>({x,y,w,h:hh,seed,base,thick,tone:134,rot:0,under:-1});
editLoad(JSON.stringify({plates:[pt(10,12,4,3,1,0,0.2), pt(13.5,12,4,3,2,1.3,0.3), pt(10,18,4,3,3,0.9,0.3), pt(20,8,8,6,4,0,1.5), pt(20,11.5,3,2,5,0,0.4), pt(19,7,2,1.6,6,1.5,0.3), pt(21,7,2,1.6,7,0,0.3)],pits:[],seams:[]}));
const put=(x,y)=>{ h.x=x*UNIT; h.y=y*UNIT; h.vx=h.vy=0; h.z=0; h.vz=0; h.liftAt=null; h.plPrev=[h.x,h.y]; };
// 1. walk west under the overhang (base 1.3, head room 1.1): you pass, the ground stays 0, you are drawn before it and the x-ray shows you
const [OX,OY]=mtnProj(14.5,12,0,state.mtn); editMove(OX,OY); run(1); state.keys.t=true; run(1); state.keys.t=false; run(1);
put(16.2,12); run(2); const start=lift(); state.keys.arrowleft=true; let xray=false, under=false, rose=0; for(let k=0;k<70;k++){ run(1); if(plateHas(pl().list.find(p=>p.seed===2),tx(),12)){ under=true; if(state.mtn.xray) xray=true; rose=Math.max(rose,h.lift||0); } } off(); run(2);
console.log('1 under the overhang: passed to x', tx().toFixed(1), '(from 16.2, the overhang spans about 11.5 to 15.5) | put down on ground', start, '| was under it', under, 'ground under it at most', rose, '| the x-ray showed', xray);
// 2. a tap under it does not land on it (0.56 jump, its top 1.6); the 0.9 plate is lower than your head: a wall
put(13.5,12); state.keys.btnjump=true; run(1); state.keys.btnjump=false; let peak=0; for(let k=0;k<50;k++){ run(1); peak=Math.max(peak,h.z/UNIT); } const landed=lift();
put(10,20.2); state.keys.arrowup=true; run(60); off(); const stopped=h.y/UNIT, heldAt=lift();
console.log('2 a tap under it: peak', peak.toFixed(2), 'tiles, landed at', landed, '| walked north at the 0.9-base plate: stopped at y', stopped.toFixed(2), '(its foot about 19.5) ground', heldAt);
// 3. the order: the 0.4 plate laid across the big plate's south edge comes after it; the 0.3 plate buried in it before it; the one on its top (base 1.5) after it
const PL=pl().list, at=s=>PL.indexOf(PL.find(p=>p.seed===s)), big=at(4);
console.log('3 painted: big', big, '| the 0.4 across its south edge', at(5), '(after it', (at(5)>big)+')', '| the buried 0.3', at(7), '(before it', (at(7)<big)+')', '| the one on its top', at(6), '(after it', (at(6)>big)+')', '| the face keys never go north', PL.every((p,i)=>!i||p.fkey>=PL[i-1].fkey), '| tops by height: the 1.5 after the 0.4 and the 0.3', PL.find(p=>p.seed===4).key>PL.find(p=>p.seed===5).key&&PL.find(p=>p.seed===4).key>PL.find(p=>p.seed===7).key, '| all tops after the ground', PL.every(p=>p.key>=PL_TOPKEY));
console.log('errs', errs);
`);
