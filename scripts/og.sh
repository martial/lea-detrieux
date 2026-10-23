#!/bin/sh
# Renders scripts/og.html to public/og.jpg (1200×630). Needs `npm run dev` running.
#   sh scripts/og.sh                 dev server on :5194, writes public/og.jpg
#   PORT=5202 sh scripts/og.sh x.jpg another port, another output file
set -e
cd "$(dirname "$0")/.."
port=${PORT:-5194}
out=${1:-public/og.jpg}
tmp=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --user-data-dir="$tmp/profile" --hide-scrollbars --window-size=1200,630 \
  --virtual-time-budget=4000 --screenshot="$tmp/og.png" "http://127.0.0.1:$port/scripts/og.html" >/dev/null 2>&1
magick "$tmp/og.png" -crop 1200x630+0+0 +repage -quality 86 "$out"
rm -rf "$tmp"
echo "$out"
