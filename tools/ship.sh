#!/bin/sh
# one call per build: sh tools/ship.sh NN "Build NN: what changed" [scene]
# Bumps BUILD, builds, checks nothing top-level is unused (tools/dead.js), runs every test and the overlap check, and only if all pass packages quest-bNN.zip into
# /mnt/user-data/outputs (older ones removed) and prints the ship line and links. HISTORY (and HANDOFF at a
# handoff) are written by hand before this.
set -e
N="$1"; MSG="$2"; SCENE="${3:-rise}"
[ -n "$N" ] && [ -n "$MSG" ] || { echo 'usage: sh tools/ship.sh NN "Build NN: message" [scene]'; exit 1; }
cd "$(dirname "$0")/.."
sed -i "s/const BUILD = 'build [0-9]*'/const BUILD = 'build $N'/" src/draw.js
grep -q "const BUILD = 'build $N'" src/draw.js || { echo "BUILD not set"; exit 1; }
sh build.sh
node tools/dead.js > /tmp/ship-dead.txt || { cat /tmp/ship-dead.txt; echo "UNUSED NAMES: delete them or mark keep: with a reason; not packaged"; exit 1; }
node tests/run.js > /tmp/ship-tests.txt 2>&1 || { grep -v '^ ok ' /tmp/ship-tests.txt; echo "TESTS FAILED: not packaged"; exit 1; }
tail -1 /tmp/ship-tests.txt
OV=$(node tools/overlap.js | tail -1); echo "$OV"
echo "$OV" | grep -q "overlaps 0$" || { echo "OVERLAPS: not packaged"; exit 1; }
mkdir -p /mnt/user-data/outputs; rm -f /mnt/user-data/outputs/quest-b*.zip
zip -qr "/mnt/user-data/outputs/quest-b$N.zip" index.html src tests tools docs HANDOFF.md QUEST_WAYS_OF_WORKING.md PROJECT_INSTRUCTIONS.md build.sh manifest.webmanifest icon-192.png icon-512.png
echo "packaged /mnt/user-data/outputs/quest-b$N.zip ($(unzip -l "/mnt/user-data/outputs/quest-b$N.zip" | tail -1 | awk '{print $2}') files)"
node tools/links.js "$N" "$MSG" "$SCENE"
