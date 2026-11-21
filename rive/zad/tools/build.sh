#!/usr/bin/env bash
# Rebuilds Zad from the drawing: SVG -> Rive markup -> poses -> zad.riv -> the site's public folder.
# Needs the Rive CLI (https://rive.app/docs/cli) signed in (`rive login`); each run counts as one publish.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PATH:$HOME/.rive/bin"
python tools/make_svg.py zad3d.svg
rive svg zad3d.svg --out=scene.rml --artboard=Zad --force --quiet
python tools/add_motion.py scene.rml
rive . --verify
if [ "${1:-}" = "--publish" ]; then
  rive . --publish
  cp build/zad.riv ../../public/prototypes/zad-rive/zad.riv
fi
