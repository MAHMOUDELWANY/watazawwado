# Renders the homepage film (v5): 16:9 and 9:16, Arabic and English.
export CHROME="C:/Users/ahmed/AppData/Local/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-win64/chrome-headless-shell.exe"
export FILM=film5.html VO=v5
mkdir -p ../export/v5
for l in ar en; do for f in 169 916; do node render.mjs $l $f ../export/v5/$l-$f.mp4 || exit 1; done; done
