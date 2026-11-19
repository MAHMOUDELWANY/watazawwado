export CHROME="C:/Users/ahmed/AppData/Local/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-win64/chrome-headless-shell.exe"
for l in ar en; do for f in 169 45; do node render.mjs $l $f ../export/v4/$l-$f.mp4 || exit 1; done; done
