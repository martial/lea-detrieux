#!/bin/sh
# Renders scripts/og.html to public/og.jpg (1200×630). Needs `npm run dev` running on :5194.
set -e
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --user-data-dir="$tmp/profile" --hide-scrollbars --window-size=1200,630 \
  --virtual-time-budget=4000 --screenshot="$tmp/og.png" http://127.0.0.1:5194/scripts/og.html >/dev/null 2>&1
magick "$tmp/og.png" -crop 1200x630+0+0 +repage -quality 86 public/og.jpg
rm -rf "$tmp"
echo "public/og.jpg"
