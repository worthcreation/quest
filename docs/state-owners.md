# Quest: who owns each state.* field (build 185)

Every top-level field of `state`, the file that owns it, who else touches it, and where ownership is split or
unclear. Made from `node tools/state-owners.js` (counts of direct `state.x` writes, nested mutations and reads per
src file, tests and tools listed separately) plus reading the code. No code moved in this build; the proposals at the
end are for Ross to pick from, one build each.

How to read it:
- Owner: the file whose logic gives the field its meaning, usually the one that creates, updates or consumes it. A
  reset in `enterScene` or `resetRun` (engine.js) does not make engine the owner; that pattern is normal and is
  written "reset" below. The `state = { ... }` literal (world.js then, engine.js since build 187) declares 69 fields; the other 93 appear on first
  assignment ("ad hoc").
- Others: `w` writes the field itself, `m` mutates something inside it, `r` reads. Direct `state.x` accesses only:
  a field read into a local and mutated through the alias (`const cb = state.combo; cb.step = ...`) counts as a
  read, so combo and fireHold look read-only here but are not.
- Flag: split (two or more files write it for their own reasons), stray (one write in a file that has no business
  with it), dead (written and never read in src), test-only (src writes it for the harness).
- Tests and tools/shot.js poke almost everything; they are not owners and are left out of the rows.

Counts: 162 fields in src. 69 in the literal, 93 ad hoc (74/88 in the first version of this doc was a miscount). 4 dead or never set (active, enterT, frameDt, clouds2),
1 test-only (tutStep), 2 more fields exist only in tests (qT in tests/rocks-banners.js is a stale name for questT;
tqDone is tests/speech.js's own quest flag). 140 have one clear owner and at most resets elsewhere; 22 are flagged.

## engine.js (update, enterScene, movement, weather, gusts): 44
| field | others | note |
|---|---|---|
| scene | read everywhere (tutorial 11, menu 9, draw-ui 9, items 7, puzzles 7, ...) | |
| entry | cutscenes r | where you came in |
| area | | place name, for the area title |
| seen | save w/r, draw-ui r3, menu r | screens visited; saved |
| playTime | save w/r; interact r10, items r4, critters, pip, tutorial, craft, quests, gear r | saved |
| time | read everywhere (draw 65, draw-ui 38, pip 34, combat 24, ...) | the clock; only engine advances it |
| busy | interact r | |
| fade, fadeTarget, fadeRate | cutscenes w fadeTarget 7, fadeRate 4; draw r fade | cutscenes drives the target, engine runs the fade: fine |
| flash | cutscenes w3, interact w1; draw r | an effect request; engine counts it down |
| shake | critters w11, cutscenes w9, items w6, combat w3, interact w2, actions w2, gear w2; draw r | same: everyone asks, engine counts down |
| night | pip w (startIntro), arena w, puzzles w; draw r3 | |
| nightT | | |
| rain | pip w, arena w, puzzles w | |
| clouds | rise r, draw r | field clouds, made at enterScene |
| gust, gustT, gustIdx, gustPhase, gustStep, gustDur, gustTempo | pip r5 gustPhase, highlands r2, draw r, actions r | the whole gust system is engine's |
| blind | critters w1; draw r2 | critters sets, engine counts down |
| flock | critters r2, draw r2 | |
| floaters | critters w1; draw r2 | |
| glimpse | world w (overview clears); draw r | Pip carried past, at enterScene |
| solids | read: items 6, actions 4, draw 4, tutorial 3, rise 2, combat 2, critters 2, draw-ui 2, highlands, arena | refreshSceneGeometry builds it |
| pools | arena r3, draw r2, interact r | |
| fx | pushed by 11 files (engine 10, items 7, draw 7, critters 6, cutscenes 4, ...); critters, draw-ui, rise r | the particle list; engine clears and runs it: shared by design |
| items | items w6 r3, interact w5 r3, critters w5, actions w3, cutscenes w1, menu w1; tutorial r4, draw-ui r3 | the screen's pickups; enterScene builds it from rt, saveScene stores it: engine's, everyone drops into it |
| won | cutscenes w (the ending); input r3, text, quests r | |
| actUsed | actions r3 | did F do something this frame |
| slotT, tiredT | | |
| dismissedAt | pip r | |
| forceInteract | items w1 | items asks, engine consumes next frame: fine |
| overFalls | interact w1 | rapids sets, enterScene('gleampool') consumes: fine |
| enterT | | **dead**: set at enterScene, never read |
| frameDt | | **dead**: set in update, never read |
| lastSlot | actions w3 r1 | **split**: engine sets 'f' on act, actions sets the slot key and the wheel's pick; the R wheel's memory, actions' business |
| fSlotAbility | actions w1 r1 | **split**: same pair; which ability sits on F |
| hero | mutated: cutscenes 7, engine 3, menu 3, save, arena, puzzles, world; read everywhere | movement is engine's; the mutations elsewhere are placements (scenes, tests rows, load): fine |
| cam | cutscenes m11, engine m4, boot m2, critters m1, interact m1; input r6, draw-ui r4, highlands r2, draw r2 | **unclear**: the camera update (the code that reads cam and moves it) lives in input.js; the writers set cam.focus. Owner is whoever holds that update |

## input.js (keys, touch, camera, sfx, music): 5
| field | others | note |
|---|---|---|
| keys | interact w3, menu w1, climb m2 r2 | interact and menu clear it when a menu opens (`state.keys = {}`): a swallow, see prevKeys |
| prevKeys | interact w3, menu w1 | **stray**: interact and menu write `state.prevKeys = {}` in three places to swallow the press that opened a menu; input's job, wants one helper |
| remap | menu w1 r2 | the key-remap flow; menu opens it: fine |
| radialPtr | actions w1 r2 | actions clears it when the wheel closes: fine |
| slotAct | engine r2 | |

## text.js (say, showTitle, scrolls, tips): 6
| field | others | note |
|---|---|---|
| texts | draw-ui w1 (begin), world w1 (overview), engine w1 (reset); pip r4, input r | |
| title | draw-ui w1, world w1, engine w1 (resets); quests w1; pip r2 | **stray**: quests.js:69 builds a herald title object itself instead of calling showTitle |
| titleQ | quests w1 r1 | same line in quests |
| scrolls | draw-ui r | |
| tipPool | draw r | |
| choice | interact w3 r2; cutscenes m1; engine r2, draw r | **unclear**: the choice menu is created and run in interact.js (askChoice, updateChoice) but its click handling is in text.js and its rects in draw.js. Owner should be interact |

## combat.js (blades, slashes, lunge, whirlwind, pound): 13
| field | others | note |
|---|---|---|
| atk | engine w1, gear w1 (resets); draw-hero r2, critters, draw r | |
| atkCool | | |
| hold | engine w1 m2 (reset), actions m1; critters r2, draw-hero r2, draw r | |
| combo | | mutated through the alias `cb` |
| chain | | |
| whirl, whirlCool | engine m1 (reset); draw r4, critters r3, draw-hero r | |
| slam | engine w1 r4; draw-hero r2, draw r | engine's jump code reads it: fine |
| slashBuf | actions w1 | actions clears it when a throw starts: fine |
| poundChain, crazy | | |
| noSwingUntil | actions w1 | **unclear**: only actions writes it (after a throw); combat only reads it. A combat gate owned by nobody |
| active | actions w, engine w, gear w | **dead**: written in five places (always beside `state.equip = ...`), read nowhere |

## actions.js (throwing, the R wheel, abilities, shots): 9
| field | others | note |
|---|---|---|
| aim | engine m1, puzzles m1 (resets); draw r2, draw-hero r | |
| radial | engine r3, draw-ui r2, input r | |
| swapT | | |
| spark | engine w1, cutscenes w1 (clears) | |
| gas, shots | engine w1 (reset); draw r, rise r, critters r | |
| fireHold | | mutated through the alias `fh` |
| throwT | draw-hero r | |
| dodged | critters w1 r1 | critters sets it on a dodge, actions clears: fine |

## items.js (pickups, drops, buried rocks, pulls): 8
| field | others | note |
|---|---|---|
| pull | engine w1 m1 (reset); draw r6, actions r3, combat r | |
| stickCool, treeCool | | |
| treeShake | actions m1; draw r | |
| slowmo | critters w1, draw-ui w1 r1 | **stray**: the countdown (`state.slowmo -= dt`) is in loop() in draw-ui.js, not in update(); items and critters only set it |
| cropFree | interact w1 r2; engine r | items sets when a crop is pulled free, interact clears: fine |
| carrySeed, carryT | interact w1 each; actions r | see carry |

## carry: shared between items, interact and actions (1)
| field | others | note |
|---|---|---|
| carry | actions w2 r6, engine w1 r7, interact w1 r4, items w1 r2, save w1, puzzles w1; draw r5, tutorial r4, combat r3, draw-hero r2, draw-ui r | **split**: interact picks up (a rock by hand), items picks up (a rock pulled from the ground), actions throws, engine drops on a fall, save loads. carrySeed and carryT are set in the same two pickup lines. No file owns "pick up" |

## critters.js (enemies, AI, damage, fx): 11
| field | others | note |
|---|---|---|
| enemies | engine w4 (enterScene builds), arena w2, puzzles w1 (spawns); draw-ui r5, combat r3, tutorial r3, draw r3, actions r2, ... | |
| hazards, rings, drops, splashes, dripTimer | engine w1 each (reset); draw, draw-ui r | |
| webs | engine w1 (built at enterScene); draw r2, actions r, gear r | |
| grab | highlands w1 r1, engine w1 (reset) | **split**: the hawk grabs in critters.js (MONSTERS.hawk.ai), the carry-off is run in highlands.js. Same seam as the parked hawk timer |
| robinMiss | | |
| bird | engine w1 (made at enterScene) r1; actions r5, combat r4, draw-ui r2, tutorial, gear, draw r | the robin (makeBird, updateBird, scareBird are critters') |
| stalCool | draw r | |

## interact.js (interact, patches, NPC talk, fishing, rapids, mushrooms): 5
| field | others | note |
|---|---|---|
| npcTalk | engine w1 (reset) r1; input r, actions r | |
| fish, fishCool | engine r2, draw-ui r, draw-hero r | |
| rapids | engine w1 (made at enterScene); draw r2 | |
| shroomWoke | gear r | |

## pip.js (following, leading, pottering, tutorial talk): 12
| field | others | note |
|---|---|---|
| pip | cutscenes w2 r5, climb w1 (clears); draw r9, draw-ui r7, rise r3, critters r2, tutorial r | cutscenes place him for the abduction and rescue: fine |
| pipAhead, pipCalls, pipGatherKey, pipSeekT, pipTalkT, remind | | |
| pipGone | engine w1 (reset) | |
| intro | climb w1 (clears); draw-ui r4, engine r2, interact r2, quests r2, draw r | the intro walk; pip's |
| tutStep | | **test-only**: pip writes it, only tests read it (camp-tour, garden, pip-post) |
| clouds2 | draw r3 | **dead**: startIntro sets it to 0 and nothing sets it to anything else; draw.js has two reads for it |
| fireLit | craft w1; draw r2 | **stray**: craft lights it when the fire is built; startIntro (pip.js) also sets it, with night and rain, as a "fresh game" reset that belongs in resetRun |

## tutorial.js: 1
| field | others | note |
|---|---|---|
| coach | draw-ui r | |

## cutscenes.js (dusk, abduction, sword, homecoming, rescue, ending): 5
| field | others | note |
|---|---|---|
| cut | engine w2 (reset, tests), interact w1, climb w1, arena w1, puzzles w1 (all clear it); draw r14, critters r2, pip r2, draw-ui r2, draw-hero r | |
| dusk | draw r3, engine r2, interact r2, craft r | |
| dawn, sporeTint, gremlins | draw r | |

## menu.js (the pack): 7
| field | others | note |
|---|---|---|
| menu | interact w5 (opens forge, map, chest, book, mirror views), craft m3 r6 (the mat's view), engine w1 (reset); tutorial r5, draw-ui r4, draw r3, ... | interact opening a menu with a literal `{ view: ... }` is the same shape openView makes: those five could call it |
| lastTab | | |
| qlogOpen | draw-ui w1 r3, engine w1 (reset) | **split**: toggled in menu.js by key and in draw-ui.js by a tap hit; two toggles of one flag |
| climbReturn | climb w2 r1 | **split**: menu's Testing rows set it before enterScene('climb1'); climb.js sets and reads it. climb should own it behind a startClimb(id) |
| tileCache | draw-ui w1 r3 | menu clears it |
| menuRects, packHits | draw-ui w | draw-ui builds the hit rects, menu reads them for taps: fine, same as the other rects below |

## save.js: 2
| field | others | note |
|---|---|---|
| settings | menu m6 r11, input m1 r3; draw-ui r3, world r2, climb, rise, draw r | menu edits settings, save persists them: fine |
| tipsSeen | engine m1 r1 | |

## craft.js: 1
| field | others | note |
|---|---|---|
| mat | menu w1 r1; tutorial r | |

## quests.js: 5
| field | others | note |
|---|---|---|
| qDone, qPulse, questHudRect | | |
| questQuiet, questT | engine w1 each (reset) | |

## gear.js (slots, equipment): 4
| field | others | note |
|---|---|---|
| equip | actions w1, engine w1, items w1, cutscenes w1, arena w1; menu r3, draw-hero r | **split**: six files assign it directly; five of them also assign the dead `active` beside it. Wants one setEquip(id) in gear |
| slotFlash | draw-ui r2 | |
| slotLit | actions w1; draw-ui r | |
| shroomRip | | |

## draw.js (the scene painter): 4
| field | others | note |
|---|---|---|
| frameNo, glintOn | | draw's own frame counters: fine |
| choiceRects | text r | **stray**: a UI hit rect, the only one not in draw-ui; text.js reads it for taps |
| arenaBanner | arena w2; draw-ui r2 | **stray**: draw.js:408 (the rapids meter) stores its rect in arena's banner field so the HUD moves out of its way; a name borrowed, not shared |

## draw-ui.js (HUD, banners, menus drawn, the frame loop, begin): 12
| field | others | note |
|---|---|---|
| started | input r2, engine r2, pip r2, menu, quests, gear, boot r | set once in begin(); begin lives in draw-ui, which is why. Owner really is the boot flow |
| created | | |
| actionHint, bannerRect, hintActs, hintRect, hudRect, hudVig, hudVigT, marquee, textBoxes, vigorBar | menu r some | HUD layout and hit rects; textBoxes and hintActs are kept for the tests |

## highlands.js (hr1-hr3): 2
| field | others | note |
|---|---|---|
| vistaBirds | engine w1 (reset) | |
| highTitle | engine w1 | **stray**: enterScene creates it (`if (id === 'hr3' ...)`); highlands draws and ends it. The one-line create could be a highlands hook |

## climb.js: 1
| field | others | note |
|---|---|---|
| climb | engine w2 (made at enterScene, cleared) r2; draw r2 | |

## rise.js: 1
| field | others | note |
|---|---|---|
| rise | engine w1 (made at enterScene), world w1 (overview flattens it); draw r3, input r | |

## arena.js, puzzles.js: 2
| field | others | note |
|---|---|---|
| arena | menu w1 r3 | menu's Testing rows start it: fine |
| puzzle | menu w1 r3 | same |

## The player's record, no single owner: 1
| field | others | note |
|---|---|---|
| inv | mutated by 15 files (engine 5, critters 6, pip 5, interact 4, cutscenes 4, tutorial 2, menu 2, draw-ui 2, save 2, climb 2, quests, gear, craft, highlands, items); read by 24 | shared by design: it is the save. newInv lives in world.js with the state literal |

## Where the literal lives
Build 185: `state = { ... }`, newHero, newInv, newPull and maxVig sat in world.js, away from resetRun in engine.js.
Since build 187 they sit just above resetRun; world.js keeps `var state;` because refreshK reads it at load.

## Proposed moves (Ross picks; one build each, no change in play, suite diffed before and after as WAYS 5 says)
Struck through with the build number as each ships. Rows above still describe build 185.
1. ~~Delete the dead fields: `active` (5 writes), `enterT`, `frameDt`, `clouds2` (its write and draw's two reads).
   Mark `tutStep` `// keep: read by tests`. Fix tests/rocks-banners.js `state.qT` to `state.questT`.~~ Done, build 186
   (158 fields).
2. ~~Move the state literal, newHero, newInv, newPull, maxVig from world.js to the top of engine.js beside resetRun,
   and fold startIntro's `night = 0; rain = 0; fireLit = 1` into resetRun. world.js keeps only `var state`.~~ Done,
   build 187: the block sits just above resetRun; startIntro's night and rain went (resetRun already zeroes them).
   fireLit stayed in startIntro: moving it changes play (see 11).
3. ~~Move the slowmo countdown from loop() (draw-ui.js) into update() (engine.js), where every other timer runs.~~
   Done, build 188 (with 11). Play in the browser is the same; the harness now runs slowmo too (it never did).
4. ~~One `setEquip(id)` in gear.js; the six direct `state.equip = ...` call it (goes with 1, since `active` sits on the
   same lines).~~ Done, build 189: there were seven (gear had two); setEquip sits beside syncEquip and is the only
   write left.
5. ~~One `pickUp(kind, seed)` in items.js that sets carry, carryT and carrySeed; interact.js:181 and items.js:158
   call it. Owner of carry becomes items; actions still throws, engine still drops.~~ Done, build 190, named
   `liftRock(seed)` (carry is only ever 'rock', and pickUpHere already exists). The clears stay where they are.
6. ~~`swallowKeys()` in input.js for the four `state.keys = {}; state.prevKeys = {}` lines (interact 3, menu 1).~~
   Done, build 191: five lines (input.js's key remap had one too); swallowKeys is now the only place either is reset.
7. quests.js:69: call showTitle instead of building the herald title by hand (check showTitle can take the note).
8. climbReturn: `startClimb(id, from)` in climb.js; menu's two Testing rows call it.
9. Small strays, one build together: qlogOpen toggled through one `toggleQlog()` in menu.js; choiceRects moved to
   draw-ui.js with the other rects; the rapids meter in draw.js stores its rect as `state.bannerRect`-style field of
   its own (or reuses bannerRect) instead of arenaBanner; highTitle created by a highlands hook that enterScene
   calls; interact's five menu literals go through openView.
10. Leave alone: cam (the camera update in input.js is a bigger question than a field; revisit if input.js is ever
    split), grab (part of the parked hawk work), inv, hero, fx, shake and flash (shared by design).
11. ~~Found in build 187, a play change for Ross to decide: `state.fireLit` is set only by startIntro and by building
    the fire, and draw.js gives the campfire its night glow only `if (state.fireLit)`. Load a save in a fresh session
    and it is undefined: the flame draws but gives no light at night. Fix: set it in resetRun (one line, and the one
    in startIntro goes). Opus.~~ Done, build 188 (Ross approved): resetRun sets it.
