# Quest: what the project is, and how we work on it
Checked 29 Sep 2026 against build 164 source; the build and ship flow updated in build 180 (chat only). Start
with HANDOFF.md's Next task and read the sections here that the task touches.

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
7. Render only when Ross asks (a still, a mockup, a look to check). Tests carry the proof otherwise.
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
4. While working: `node tools/build.js` and `node tests/<name>.js` for the tests it touches. No renders unless asked.
5. Write the one short HISTORY entry, then ship in one call: `node tools/ship-local.js NN "Build NN: ..." [scene]
   --zip`. It bumps BUILD, builds, runs dead.js, every test (about 2 minutes) and the overlap check, stops at the
   first failure, packages /mnt/user-data/outputs/quest-bNN.zip and prints the commit line (it unzips first) and every
   play-test link with a fresh prime (tools/links.js holds the list). Never commit or push: Ross runs the line.
6. Deliver: the zip as a download; what changed (grouped by what the player sees), what was tested with numbers,
   any files to delete by hand in ~\quest, then the printed commit line and links as they came out.
7. For unsettled looks, iterate on still mockups first (no build), when Ross asks for them.

## 4. Reuse table (checked against source; file in brackets)
- World: barrier()/breakBarrier [world/engine]; crag() + hitCrag (single boulders that crack, drops) [world/items];
  keystone()/hitStone [world/items]; pullable() + pullLocked [world/items]; claim()/freeSpot() [world];
  enterScene layout hooks; RT[id].flags.
- Text: say() [text] (pages, holds), pipLine() for anything Pip says (hold: true waits for F) and pipSay() for a once-only line [pip], showTitle() for quest start/end only, showScroll() for every
  other alert, notice() for pickups (a scroll too). There is no tell() and no questAlert; don't look for them.
- Pip: PIP_LINES (one-off lines with when/at/text), TUTORIAL (ordered steps), COACH (pinned steps, shown only inside
  the pack; outside Pip says them) [tutorial]; drawPip() is the only Pip drawing [draw]; PIP_PACE, PIP_SIZE;
  pipPost/pipArrive decide where Pip is on a screen (enterScene and updatePip both call it), pipBackIn brings him in
  from an edge, exitToward/exitPoint [pip].
- Story: inv.story + STORY [craft], storyAt() [quests], campBuilt() [craft]; QUESTS + updateQuests + drawQuestHud
  [quests] (updateQuests watches flags, never drives them); inv.qtrack.
- Progression: SKILLS/skillUse [skills]; FOOD [gear]; SEEDS [items]; plotStage() + PATCH [interact]; CROP_XP [gear];
  RECIPES [craft]; slots SLOT_KEYS/useSlot/flashSlot [gear]; the R wheel [actions].
- Drawing: drawItemIcon for every icon [draw-ui]; drawJagged (optional context) for every rough stone; drawRock (seeded
  lumpy stone) and drawSoilLine (the zigzag where stone meets ground; soilLinePts gives its points, to clip a stone to
  it), rounded(x, y, w, h, r) for every rounded box and groundShadow(x, y, w, h, z, opts) for every shadow on the
  ground (shadowScale(z, u) is the height rule) [draw]; drawHUD is bottom-right (vigor and
  slots, fading when quiet); the quest HUD is top-right; banners own the top only for quest start/end.
- Climb screens: CLIMB_TUNE (movement, wind) and CLIMB_SPECS (each screen's layout, as numbers) [climb]; climbScreen
  turns a spec into CLIMBS[id] (cx, hw, gap); newClimb/updateClimb/drawClimb; SHADOW tuning.
- A scene bigger than the screen: give it sc.virt = [w, h] in tiles; sceneSize makes W and H its size while it's
  current (update and enterScene), and L() walks at the screen's pace. Every mountain screen is one (rise, mt2, flat): a spec in MTN
  (mountain.js), built by mtnLand, addMtn, mtnHalf, mtnView, mtnCamera, drawMtn (draws the game's own things at their
  spot on its ground), mtnCragSprite [mountain]. Its solids are the collision; nothing else tests an edge there.
- Plates (the mountain's stone, 212): plateOutline, plateHas (the one shape for drawing and the hold), plateAdd/
  platePit/plateSeam, plateLayout (a screen's m.plates reads LAYOUTS[id], src/layouts/<id>.js), platesLay,
  plateTopAt, plateHold, drawPlate; mtnProj is the one projection (m.eye); ravPal for a ravine's colours [plates,
  mountain]. The editor (215): ?edit=<scene>, startEdit, editTile, editPick, editDown/Move/Up/Wheel, updateEdit,
  editText/editLoad, drawEdit [edit]; a new layout key goes in plateAdd, editText and the file's header comment.
- Mode flags: ARENA, PUZZLE, MODEL_ON, MOUNTAIN, START_SCENE, EDIT_SCENE (state.edit while it runs), TEST_MODE (tests only), and only where section 1 says.

## 5. Audit
- `node tools/audit.js` is the report card: unused names, size (lines per file, lines over 200 characters, distinct
  state.* fields), the longest functions (over 150 lines flagged), statement shapes written 5+ times (a helper
  waiting to happen), and update plus draw cost per screen in the harness (over 2 ms flagged, errors listed). About
  6 seconds. It compares against docs/audit-baseline.json.
- Run it at the start of a cleanup chat and at every handoff; not every build. At a handoff: `node tools/audit.js
  --save`, and copy its last line (the summary) into HANDOFF.md.
- It informs; it doesn't block. Only `node tools/dead.js` stops a ship (tools/ship-local.js runs it right after the build):
  a top-level name nothing references is deleted in the same build, or marked `// keep: <reason>` on its definition
  line if it's a hook on purpose (startEnding is).
- What it flags goes on HANDOFF's cleanup list and gets its own build, separate from feature builds. The fix for a
  flagged function is to split it the next time a feature touches it, unless Ross asks for a cleanup build.
- Baseline (build 193): 11031 lines, 0 unused, 1 function over 150 (genWorld 533), 0 repeats, 158 state fields,
  frames avg 0.5 ms, 1 over 2 ms (rise), 0 errors.
- Proving a refactor with no change in play (builds 180 to 182): save every test's full output before (run each
  tests/*.js except harness.js and run.js, one file per test) and diff after, ignoring the BUILD label; for drawing,
  `node tools/draw-record.js` records every canvas call per solid kind and item type (compare its total hash); for
  anything the tests don't reach (menus, doodles), eval the old index.html (git show HEAD:index.html) and the new one
  with a recording canvas and compare. Report the counts.
- Never glob-delete in src/ (an old p*.js cleanup also matched pip.js and puzzles.js).

## 6. Definition of done
- `node tools/ship-local.js NN "..." --zip` finished and the zip delivered as a download: build parses, dead.js 0,
  every test passes, 0 overlaps, BUILD bumped.
- Anything laid out in tiles is tested at both screen shapes (1280x800 and 390x844) by numbers. Grep for stale words.
- One short entry at the top of docs/HISTORY.md every build. HANDOFF.md's current-state sections at a handoff (end of
  a chat, or when asked), not every build.
- Reply ends with the commit line and links as tools/ship-local.js printed them, and names any file Ross must delete
  by hand (an unzip never deletes). If a link is added or renamed in src/, update tools/links.js in the same build.

## 7. Talking to the model
Say what the player should see and feel, and the rule. Batch related changes into one build. For visuals: one
reference image plus a few words; "render a still" gets a mockup, no build. If a chat compacts, say so. Start a
fresh chat or session when the topic changes, after a heavy one (a big refactor, many large reads), or after a
compaction; otherwise keep going. HANDOFF carries everything, so a handoff comes first.

## 7a. Which model: FABLE or Opus (enforce this, every chat)
Every reply opens with a line naming the model the task in it needs, "Model: FABLE" or "Model: Opus" and a few
words why, before any work (questions included, so Ross never has to wonder). When the answer is Fable and the chat
is on Opus, Claude STOPS and says so plainly: "Switch to Fable in the model menu for this: <reason>, then continue."
It does not start the work on the wrong model to be helpful, and it does not soften it to a suggestion.
A handoff names the model the next chat starts on, and the first message it writes for that chat opens with it, so
Ross sets the menu before sending. When a list of tasks is agreed, the reply gives the model for each.

USE FABLE when any of these is true:
- the plan changes more than about four files in ways that depend on each other;
- it's a refactor with no change in play across a system (splitting genWorld by region, a MONSTERS table if it
  also reshapes combat or drawing, mapping or moving who owns which state.* fields);
- it joins or restructures parts of the world (the climb into the world, retiring f3 to f6, a new region);
- it designs a new system from nothing (a new mechanic, a new menu, a save format);
- an audit shows problems spread across many files and the job is deciding what to do about them;
- two tries on Opus haven't fixed a bug, or the cause spans several systems.
STAY ON OPUS for: one feature in one or two files, tuning numbers, a bug with a known cause, running the audit,
mechanical moves (dead code, a helper replacing repeats), docs and handoffs, mockups.
If unsure, Fable. Fable's extra safeguards cover biology, cybersecurity and AI research; none of that touches this game.
- Working a list (state-owners moves, builds 186 to 193): the list lives in a doc, each item struck through there
  with its build number as it ships; every reply reprints the full list with the model per open item; things found
  along the way (the fireLit bug) join the list as numbered items instead of a passing note; items set aside say why
  and where they went (move 8, parked with the climb).

## 8. Handoff between chats
The work happens in chat, in the Linux container. Start of every chat: `git clone
https://github.com/worthcreation/quest.git` into /home/claude, `node tools/build.js`, check `const BUILD` in
src/draw.js against main (the next build is main's plus one), read HANDOFF's Next task, then the task. Ship with
`node tools/ship-local.js NN "..." --zip` and deliver the zip as a download. Ross unzips it into ~\quest and pushes
(the printed line does both); then the clone resets to origin/main (`git fetch; git reset --hard origin/main`)
before the next build. One build at a time.
1. Each build: Claude never commits or pushes. Ross runs the printed line (Windows PowerShell, in a ```powershell
   block; PowerShell 5.1 has no &&):
   cd ~\quest -ErrorAction Stop; Expand-Archive -Force ~\Downloads\quest-bNN.zip .; Remove-Item ~\Downloads\quest-bNN.zip; git add -A; git commit -m "Build NN: ..."; git push
   git add -A, not ".", so deletions are committed too. An unzip adds and overwrites but never deletes: a file removed
   in chat must also be deleted in ~\quest by hand (the reply says which).
2. At a handoff (end of a chat, or when Ross says "handoff"): bring HANDOFF.md's current-state sections and Next task
   up to date, run the audit with --save and copy its summary in, update PROJECT_INSTRUCTIONS.md to match and
   docs/design-rules.md's Story so far if the story changed, and
   docs/PROJECT_DESCRIPTION.md only if the mood, theme or direction changed. The handoff reply always ends with three
   things: (1) the full current PROJECT_INSTRUCTIONS.md text in a code block, for Ross to paste into the Project
   settings; (2) the exact first message for the next chat, in a code block; (3) any files Ross must delete by hand
   in ~\quest.
3. Start of a chat: the fresh clone is origin/main. Confirm BUILD and the head commit against what Ross's message
   says, then read HANDOFF.md's Next task.

## 9. Roadmap
1. The mountain as one family after the rise: docs/mountain-plan.md (the climb joined in 203, f3 to f7 retired in
   204; each climb screen remade on the main game, one a build).
2. Balance pass from arena and puzzle records; sword swing cost (SWING_COST) and Pip's pace still being tuned.
3. Story after the rescue: the journal quest, spore travel, the High Reaches, then chapter 2.
4. The drawn hero, once mechanics lock.
