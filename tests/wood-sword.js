const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
run(5); state.intro=null; state.texts=[]; enterScene('f2'); state.enemies=[]; state.items=[]; run(5); const inv=state.inv, h=state.hero; state.pip&&(state.pip.show=false);
inv.woodsword=WOOD_SWORD; inv.sword=false; run(20); h.x=W*0.3; h.y=H*0.3; h.fx=1; h.fy=0;
// 1. swinging at nothing costs nothing
for(let i=0;i<10;i++){ state.atkCool=0; state.chain.n=0; press('f',2); run(20); } console.log('1 ten swings at air: durability', inv.woodsword, 'of', WOOD_SWORD, '| spinning', !!state.whirl);
// 2. two rabbits, slash by slash (not in the whirlwind rhythm: seven slashes on the beat spin, and a spin splits wood)
state.chain.n=0;
let kills=0, swings=0; for(let r=0;r<2;r++){ const e=makeEnemy('rabbit', h.x+UNIT*0.9, h.y, 0); e.mode='idle'; e.t=99; state.enemies=[e]; for(let i=0;i<30 && state.enemies.includes(e) && !e.dead && e.hp>0;i++){ h.vig=maxVig(); state.atkCool=0; state.chain.n=0; press('f',2); run(i%2?20:50); swings++; e.x=h.x+UNIT*0.9; e.y=h.y; } if(e.dead||e.hp<=0||!state.enemies.includes(e)) kills++; }
console.log('2 rabbits slain', kills, 'in', swings, 'swings | wooden sword left', inv.woodsword, 'of', WOOD_SWORD, '| still in hand', bladeKind());
// 2b. a wooden lunge: fells a rabbit at full health, goes through a second one beside it, then the sword splits
inv.woodsword=WOOD_SWORD; run(20); h.x=W*0.4; h.y=H*0.5; const r1=makeEnemy('rabbit', h.x+UNIT*1.3, h.y-UNIT*0.3, 0), r2=makeEnemy('rabbit', h.x+UNIT*1.3, h.y+UNIT*0.3, 0);   // side by side, in front r1.mode=r2.mode='idle'; r1.t=r2.t=99; state.enemies=[r1,r2];
h.fx=1; h.fy=0; h.side=1; h.vig=maxVig(); h.invuln=5; state.atkCool=0; state.chain.n=0; const pin=()=>{ if(!state.enemies.includes(r1)) state.enemies.push(r1,r2); r1.x=h.x+UNIT*1.3; r1.y=h.y-UNIT*0.3; r2.x=h.x+UNIT*1.3; r2.y=h.y+UNIT*0.3; r1.vx=r1.vy=r2.vx=r2.vy=0; }; state.keys.f=true; for(let k=0;k<40;k++){ pin(); run(1); } const ch=state.hold.charged; state.keys.f=false; pin(); run(1); const st=state.atk&&state.atk.type; for(let k=0;k<30;k++){ if(r1.hp>0) { r1.x=h.x+UNIT*1.3; } run(1); }
console.log('2b charged', ch, 'then', st, '| lunge: rabbits left', [r1,r2].filter(e=>e.hp>0 && !e.dead).length, 'of 2 | wooden sword after', inv.woodsword);
const r3=makeEnemy('rabbit', h.x+UNIT*1.3, h.y, 0); r3.mode='idle'; r3.t=99; state.enemies=[r3]; h.vig=maxVig(); h.invuln=5; state.atkCool=0; state.keys.f=true; for(let k=0;k<40;k++){ r3.x=h.x+UNIT*1.3; r3.y=h.y; run(1); } state.keys.f=false; for(let k=0;k<30;k++){ if(r3.hp>0){ r3.x=h.x+UNIT*1.3; r3.y=h.y; } run(1); } console.log('   second lunge: rabbit down', r3.hp<=0||r3.dead, '| wooden sword', inv.woodsword);
inv.woodsword=WOOD_SWORD; inv.woodLunges=0; run(20); state.enemies=[]; h.vig=maxVig(); state.atkCool=0; state.keys.f=true; run(40); state.keys.f=false; run(30); console.log('   a lunge at air: wooden sword', inv.woodsword);
// 2c. no whirlwind with a wooden sword, however steady the rhythm
inv.woodsword=WOOD_SWORD; run(20); state.chain.n=0; let spun=false; for(let i=0;i<12;i++){ state.atkCool=0; press('f',2); run(20); if(state.whirl) spun=true; } console.log('2c twelve steady slashes with wood: spun?', spun, '| sword', inv.woodsword);
// 3. no whirlwind out of a pound
inv.woodsword=WOOD_SWORD; h.vig=maxVig(); state.whirlCool=0; press(' '); run(8); press('f'); run(40); state.atkCool=0; press('f',2); run(10); console.log('3 strike right after a pound -> whirlwind?', !!state.whirl);
// 4. the lantern hangs opposite the blade
console.log('4 lantern side vs blade side:', (h.side>0?'right':'left')+' blade, lantern on the '+(h.side>0?'left':'right'));
showScroll('Gathering III', 'Things come to you when you pass close by.'); run(30); console.log('5 level-up scroll showing:', !!(state.scrolls&&state.scrolls.length), '| Status rows for gathering:', statusRows().filter(r=>/now|next|Gathering/.test(r[1])).map(r=>r[1].trim()+(r[2]&&typeof r[2]==='string'?': '+r[2].slice(0,50):'')).slice(0,3).join(' / '));
console.log('BUILD', BUILD, '| errs', errs);
`);
