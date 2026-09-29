const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\n').slice(1,3).join(' | '));} }};
const keys=['arrowleft','arrowright','arrowup','arrowdown'], off=()=>keys.forEach(k=>state.keys[k]=false);
run(5); state.intro=null; state.texts=[]; state.pip=null; startTestScene('rise'); run(20);
let r=state.rise; const z=()=>riseZoom(r.p), tilt=()=>Math.round(RISE.tilt*r.p*57.3);
// 1. it opens like the fields: straight down, full size
console.log('1 opens at x', r.x.toFixed(1), '| zoom', z().toFixed(2), '| tilt', tilt(), 'deg');
// 2. walk east like a person, keeping to the path: the view pulls back and tips as you go; off the top you loop to the bottom
const seen=[]; let t=0, r0=r; state.keys.arrowright=true;
while(state.rise===r0 && t<60*30){ const dy=risePathY(r.x+1)-r.y; state.keys.arrowdown=dy>0.3; state.keys.arrowup=dy<-0.3; run(1); t++; if(t%60===0) seen.push([r.x, z(), tilt()]); } off();
let mono=seen.every((s,i)=>!i||s[1]<=seen[i-1][1]+1e-6);
const steps=seen.slice(1).map((s,i)=>seen[i][1]-s[1]), most=Math.max(...steps), first=seen.find(s=>s[1]<0.97);
run(30); r=state.rise;
console.log('2 walked east in', (t/60).toFixed(1), 's -> looped to x', r.x.toFixed(1), 'on', state.scene, '| zoom by second:', seen.map(s=>s[1].toFixed(2)).join(' '), '| only ever pulls back:', mono, '| tilt at the foot', seen.length?seen[seen.length-1][2]:0, 'deg');
console.log('  below 0.97 zoom by x', first?first[0].toFixed(1):'-', '| biggest one-second change', most.toFixed(3));
// 3. walk back west: it comes back in
startTestScene('rise'); run(5); r=state.rise; r.x=60; r.y=risePathY(60); run(240); const z60=z(); state.keys.arrowleft=true; t=0; while(r.x>20 && t<60*10){ run(1); t++; } off(); run(120);
console.log('3 back west from x 60 (zoom', z60.toFixed(2)+') to x', r.x.toFixed(1), '(zoom', z().toFixed(2)+')', '| comes back in:', z()>z60+0.2);
// 4. off the path, straight at the mountain: the crags at its foot stop you
r.x=66; r.y=11; r.vx=r.vy=0; state.keys.arrowright=true; run(60*4); off(); const f=riseFoot(r.y);
console.log('4 heading east off the path at y 11: stopped at x', r.x.toFixed(1), '| the foot there is at', f.toFixed(1), '| stayed on open ground:', riseOpen(r.x,r.y));
// 5. the stones along each side of the way are the edge: up and down both stop
const walls=x=>{ r.x=x; r.y=15; r.vx=r.vy=0; state.keys.arrowup=true; run(150); off(); const top=r.y; state.keys.arrowdown=true; run(240); off(); return [top, r.y, riseHalf(x)]; };
const w5=walls(5), w40=walls(40), w66=walls(66), inside=[[5,w5],[40,w40],[66,w66]].every(([x,[a,b,hw]])=>a>15-hw && b<15+hw);
console.log('5 the way between the walls, wall to wall: at x 5', (w5[1]-w5[0]).toFixed(1), 'tiles | x 40', (w40[1]-w40[0]).toFixed(1), '| x 66', (w66[1]-w66[0]).toFixed(1), '| widens:', w40[1]-w40[0]>w5[1]-w5[0]+3 && w66[1]-w66[0]>w40[1]-w40[0]+3, '| held inside:', inside);
// 6. off the bottom (west) end you loop to the top, still walking west
r.x=3; r.y=risePathY(3); r0=r; state.keys.arrowleft=true; t=0; while(state.rise===r0 && t<120){ run(1); t++; } run(20); r=state.rise; const x1=r.x; run(30); off();
console.log('6 off the west end -> x', x1.toFixed(1), 'of', RISE.len, 'on', state.scene, '| still heading west:', r.x<x1, '| zoom', z().toFixed(2));
// 7. a phone: the view never shrinks you below 20 px
const sv=[W,H]; W=390; H=844; computeUnit(); const px=riseZoomMin()*UNIT; W=sv[0]; H=sv[1]; computeUnit();
console.log('7 phone: smallest hero', px.toFixed(1), 'px (zoom', (20/ (Math.min(390,844)/14)).toFixed(2)+')');
const land=riseLand(); console.log('   land:', land.rows.length, 'rows,', land.props.length, 'things standing on it,', land.solids.length, 'solid');
if (!(mono && most<0.12 && state.scene==='rise')) errs++;
console.log('BUILD', BUILD, '| errs', errs);
`);
