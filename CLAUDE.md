# Quest: notes for a new session

Quest is a browser RPG. `node tools/build.js` (or `sh build.sh`) builds src/ (order in src/ORDER) into
index.html. Edit src/, never index.html.

## Two ways to work (one ship script)
- Claude Code, on Ross's PC in ~\quest: edit, test, ship with `node tools/ship-local.js NN "Build NN: ..."`.
- Chat, in the Linux container: `git clone https://github.com/worthcreation/quest.git` into /home/claude,
  `node tools/build.js`, read Next task, work, ship with `node tools/ship-local.js NN "Build NN: ..." --zip`,
  deliver /mnt/user-data/outputs/quest-bNN.zip as a download. Ross unzips and pushes; then the clone resets to
  origin/main (`git fetch; git reset --hard origin/main`).
- One writer at a time: after a push from either side, the other pulls or resets before starting.

## Start here
- Read HANDOFF.md's "Next task" section first. Read its other sections, and QUEST_WAYS_OF_WORKING.md (WAYS),
  only when the task touches them.
- The first line of every reply names the model the task needs, FABLE or Opus, per WAYS section 7a. If it's
  FABLE and this session is on Opus, stop before any work: "Switch to Fable for this: <reason>. Run /model to
  switch, then continue."

## While working
- Before adding a function, check the reuse table (WAYS section 4). New system only when nothing fits.
- Run only the tests you touch: `node tests/<name>.js`. Each prints `errs N`; 0 is a pass.
- Full suite only at ship: `node tools/ship-local.js NN "Build NN: ..."` (bump, build, dead.js, every test,
  overlap check; prints the commit line and links; `--zip` in chat also packages the zip). About 23 s here,
  about 2 minutes in the container.

## Git
- Never commit or push, on either route. Ross reviews the diff (or the zip) and pushes himself.
- .claude/settings.json makes `git commit` and `git push` always ask.

## Docs
- Every build: one short entry at the top of docs/HISTORY.md.
- HANDOFF.md: only at a handoff (end of a chat, or when asked), not every build.

## Style
- No em dashes. Concise, candid, no filler.
