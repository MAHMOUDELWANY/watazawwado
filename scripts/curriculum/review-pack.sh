#!/bin/sh
# Evidence pack for the curriculum-review skill: review-pack.sh <outRoot> <subject> <lesson>
# Needs the curriculum-preview server on 3101. Writes <outRoot>/<subject>/L<lesson>/:
#   text.txt, audit.txt, evidence.txt        page text, build shape, ayah/hadith list
#   steps/pNN.png                             contact sheet of every build step of page NN (desktop 1600x900, page clock)
#   run-phone/, run-phone-full/, run-landscape-full/, run-dark/     real-time player runs: sheets + run.json (console issues, frame gaps)
root=$1; subject=$2; n=$3
out="$root/$subject/L$n"; mkdir -p "$out/steps"
tsx=$( [ -x node_modules/.bin/tsx ] && echo node_modules/.bin/tsx || echo ../../../node_modules/.bin/tsx )
$tsx scripts/curriculum/dump.ts "$subject:$n" > "$out/text.txt"
$tsx scripts/curriculum/audit.ts "$subject:$n" > "$out/audit.txt"
$tsx scripts/curriculum/dump-evidence.ts "$subject:$n" > "$out/evidence.txt" 2>/dev/null
$tsx scripts/curriculum/steps.ts "$subject" "$n" > "$out/steps.txt"
presses=$(wc -l < "$out/steps.txt")
pages=$(sed 's/.*&p=\([0-9]*\)&.*/\1/' "$out/steps.txt" | sort -n | uniq)
for p in $pages; do
  pp=$(printf %02d "$p")
  node scripts/curriculum/shots.mjs "$out/steps/shots-$pp" $(grep "&p=$p&" "$out/steps.txt") >/dev/null 2>&1
  python scripts/curriculum/sheet.py "$out/steps/p$pp.png" 3 "$out/steps/shots-$pp"/*.png
done
run() { # name size tile cols flags...
  name=$1; size=$2; tile=$3; cols=$4; shift 4
  node scripts/curriculum/review-run.mjs "$out/$name" "$subject" "$n" "$presses" "$size" "$@"
  i=0
  ls "$out/$name"/*.jpg | split -l $((cols * 4)) - "$out/$name/.chunk-"
  for c in "$out/$name"/.chunk-*; do
    SHEET_TILE=$tile python scripts/curriculum/sheet.py "$out/$name/sheet-$(printf %02d $i).png" "$cols" $(cat "$c"); i=$((i + 1)); rm "$c"
  done
}
run run-phone 390x844 234x506 8
# Phones are used in the player's full-screen mode (the preview page cannot scroll, so a non-full landscape run looks cut off).
run run-phone-full 390x844 234x506 8 full
run run-landscape-full 844x390 480x222 4 full
run run-dark 1440x900 480x300 4 dark
echo "pack $subject L$n: $presses steps, $(ls "$out/steps"/*.png | wc -l) step sheets"
