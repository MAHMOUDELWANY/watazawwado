#!/bin/sh
# Screenshots every build step of one page and makes its contact sheet: allsteps.sh <outRoot> <name> "<query>" <lastStep>
out=$1; name=$2; q=$3; n=$4
set --
for s in $(seq 0 "$n"); do set -- "$@" "$q&s=$s"; done
rm -rf "$out/shots/$name"
node scripts/curriculum/shots.mjs "$out/shots/$name" "$@" >/dev/null 2>&1
python scripts/curriculum/sheet.py "$out/$name.png" 3 "$out"/shots/"$name"/*.png >/dev/null
echo "$name: $(ls "$out/shots/$name" | grep -c png) shots"
