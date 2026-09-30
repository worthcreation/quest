#!/bin/sh
# Builds index.html from src/ (see tools/build.js, which does the work). Run from anywhere: sh build.sh
node "$(dirname "$0")/tools/build.js"
