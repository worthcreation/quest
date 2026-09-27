#!/bin/sh
# Builds index.html from src/: head.html, then each file named in src/ORDER (load order matters for the few
# top-level statements; functions are hoisted). Run from the repo root: sh build.sh
cd "$(dirname "$0")/src" && (cat head.html; for f in $(cat ORDER); do cat "$f.js"; done) > ../index.html && echo "built index.html ($(wc -l < ../index.html) lines)"
