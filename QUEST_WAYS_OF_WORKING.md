# Quest: what the project is, and how we work on it
Checked 29 Sep 2026 against build 164 source (the 29 Sep rewrite was against build 65 and a p-file layout that no longer
exists). Read this and HANDOFF.md at the start of every Quest chat.

## 1. What Quest is
A browser RPG, Zelda meets EarthBound, for a family on a laptop or phone. One index.html on GitHub Pages
(worthcreation/quest), built from src/ by `sh build.sh` (file order in src/ORDER). Youthful, warm, a little silly (rabbit
glue), never mean. Puzzles are physical and readable: see the thing, understand what it wants, do it with your hands.

One gameplay code for every face: Quest, Arena (?arena), Puzzles (?puzzle), test links (?mountain, ?scene=<id>).
Verified: ARENA/PUZZLE appear in engine.js (entry, hubs, dispatch), their own files, boot, menu, draw-ui, draw-hero,
and in pip/quests/tutorial only to keep the story out. Never in movement, combat, wind or AI. Keep it that way.

## 2. Principles
1. One source of truth. Gameplay lives once, in src/. A variant is a flag or a data table, not a copy.
2. Lay out in tiles at enterScene for anything you jump, hop or ride to. Screen fractions are for generation only.
3. Readable before pretty: make the rule visible first (shadow, lips, the tile overlay), then dress it.
4. Guaranteed first, chance after. Tutorials never fail on the first try.
5. Words are part of the mechanic. On every rework, grep the old words and retire them.
6. Test with numbers. "7 of 7 hops, 0 falls" is a claim; "should work" is not.
7. Render it. A PNG catches what a passing test misses. Look at it before shipping.
8. Dialogue: Pip and NPC lines (say key 'pip'/'npc') hold until F; tutorial and coach lines are free (hold:false) so
   the player can keep moving. Story flags advance from the player's actions, never from a line ending.
9. Source lives in git. Chats end.
10. Delete what lost its purpose in the same build it lost it.
11. Learned the hard way: never put a `// comment` in the middle of a one-line replacement; it swallows the rest of
    the line. build.sh now refuses to finish if the built script doesn't parse.
12. Learned the hard way: anything that takes over the update (rapids, climb) must also handle death, menus and
    dialogue itself, or the game sits on a black screen.

## 3. The feature loop (every request)
1. Restate the request in one line; name the screens, files and tests it touches. Ask one question only if the answer
   changes what gets built. Otherwise decide and state the assumption.
2. Reuse before adding (section 4). New system only when nothing fits.
3. Write or extend a headless test that plays it like a person (walk, press, wait); add a bot where scale matters.
4. `sh build.sh`, `node tests/run.js` (63 tests, about 2 minutes, one call), `node tools/overlap.js` (0 overlaps),
   render a PNG for anything visual (tools/shot.js blocks, env var per build), look at it.
5. Deliver: what changed (grouped by what the player sees), what was tested with numbers, the ship command, and every
   play-test link (HANDOFF.md, Links), current as of that build, with a fresh 7-digit prime seed. Bump `const BUILD` in src/draw.js every time.
6. For unsettled looks, iterate on still mockups first (no build). The climb took eight stills.

## 4. Reuse table (checked against source; file in brackets)
- World: barrier()/breakBarrier [world/engine]; crag() + hitCrag (single boulders that crack, drops) [world/items];
  keystone()/hitStone [world/items]; pullable() + pullLocked [world/items]; claim()/freeSpot() [world];
  corridorSpan/fitToCorridor (mountain path) [world]; enterScene layout hooks; RT[id].flags.
- Text: say() [text] (pages, holds), pipSay() [pip], showTitle() for quest start/end only, showScroll() for every
  other alert, notice() for pickups (a scroll too). There is no tell() and no questAlert; don't look for them.
- Pip: PIP_LINES (one-off lines with when/at/text), TUTORIAL (ordered steps), COACH (pinned steps, shown only inside
  the pack; outside Pip says them) [tutorial]; drawPip() is the only Pip drawing [draw]; PIP_PACE, PIP_SIZE.
- Story: inv.story + STORY [craft], storyAt() [quests], campBuilt() [craft]; QUESTS + updateQuests + drawQuestHud
  [quests] (updateQuests watches flags, never drives them); inv.qtrack.
- Progression: SKILLS/skillUse [skills]; FOOD [gear]; SEEDS [items]; plotStage() + PATCH [interact]; CROP_XP [gear];
  RECIPES [craft]; slots SLOT_KEYS/useSlot/flashSlot [gear]; the R wheel [actions].
- Drawing: drawItemIcon for every icon [draw-ui]; drawJagged (optional context) for every rough stone; drawRock (seeded
  lumpy stone) and drawSoilLine (the zigzag where stone meets ground) [draw]; drawHUD is bottom-right (vigor and
  slots, fading when quiet); the quest HUD is top-right; banners own the top only for quest start/end.
- Climb screens: CLIMBS table [climb] (trail, gap field, side); newClimb/updateClimb/drawClimb; SHADOW tuning.
- The rise: RISE table, riseH and riseOpen (one shape for standing and for where the crags go), riseLand, riseView [rise].
  A takeover like the climb: its own update and draw, hooked in enterScene, update() and drawScene.
- Mode flags: ARENA, PUZZLE, MODEL_ON, MOUNTAIN, START_SCENE, TEST_MODE (tests only), and only where section 1 says.

## 5. Audit (grep for callers, build 162)
- Done in build 162: hopToStone, drawVane, drawWindPath, plate()/logGate()/updatePlates/plateOn, camp.feat.pip, the
  fiber/cloth/cord/stake/tentkit icons, seedSlotKey/seedSlotKeyOld, drawArenaSigns, the inline plant block, the
  "tent" lines, ZIG3/ZIG4. src/pip.js and src/puzzles.js were restored (build 161 deleted them by accident).
- Still to decide with the climb: the crag() painter inside paintClimb and climbBand fixed at 12 (ledge closures off
  while testing). Keep ZIG1/zig() until the climb design settles.
- Watch for: the ship command's Remove-Item globs; p*.js also matched pip.js and puzzles.js. Never glob-delete in src/.
- No longer true: "bump BUILD in p7.js" (src/draw.js); "t21...t65 sweep" (tests are named by topic now, run all
  with tests/run.js); "state.settings.autoTalk" (gone; tests press F through held lines); "drawHUD owns the top strip".

## 6. Definition of done
- `sh build.sh` succeeds (it checks the script parses), `node tests/run.js` all pass, `node tools/overlap.js` 0.
- Both screen shapes (1280x800 and 390x844) for anything laid out in tiles. Grep for stale words. BUILD bumped.
- HANDOFF.md updated: the current-state sections, plus one short entry at the top of docs/HISTORY.md.
- Reply ends with the ship command and every play-test link, full URLs, checked against the source (HANDOFF.md, Links).

## 7. Talking to the model
Say what the player should see and feel, and the rule. Batch related changes into one build. For visuals: one
reference image plus a few words; "render a still" gets a mockup, no build. If a chat compacts, say so.

## 8. Handoff between chats
1. Each build: one download, quest-bNN.zip, laid out like the repo root. Ship (Windows PowerShell, in a ```powershell
   block so it's coloured; PowerShell 5.1 has no &&):
   cd ~\quest -ErrorAction Stop; Expand-Archive -Force ~\Downloads\quest-bNN.zip .; Remove-Item ~\Downloads\quest-bNN.zip; git add -A; git commit -m "Build NN: ..."; git push
   (git add -A, not ".", so deletions are committed too.)
2. At a handoff: refine PROJECT_INSTRUCTIONS.md against the source, and docs/PROJECT_DESCRIPTION.md only if the mood,
   theme or direction changed. Give both as copyable text, always the full current file, never just the changes;
   they go in the claude.ai Project settings.
3. Start of a chat: clone worthcreation/quest, read HANDOFF.md and this file, then the task. github.com is reachable
   from the container; no uploads needed once the repo is current.

## 9. Roadmap
1. The climb: settle the look (screens 1 to 5 on ?mountain), then decide where it joins the real world (between the
   windy fields and the crags) and retire the f2-f6 mountain-path screens it replaces.
2. Balance pass from arena and puzzle records; sword swing cost (SWING_COST) and Pip's pace still being tuned.
3. Story after the rescue: the journal quest, spore travel, the High Reaches, then chapter 2.
4. The drawn hero, once mechanics lock.
