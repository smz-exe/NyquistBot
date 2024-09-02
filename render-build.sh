#!/usr/bin/env bash
# exit on errorset -o errexit

# PUPPETEER_CACHE_DIRを手動で指定
PUPPETEER_CACHE_DIR=/opt/render/project/puppeteer

# XDG_CACHE_HOMEを手動で指定
XDG_CACHE_HOME=/root/.cache

echo "PUPPETEER_CACHE_DIR is set to: $PUPPETEER_CACHE_DIR"
echo "XDG_CACHE_HOME is set to: $XDG_CACHE_HOME"

npm install
npx puppeteer install
# npm run build # uncomment if required

# Store/pull Puppeteer cache with build cache
if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then
  echo "...Creating Puppeteer Cache Directory"
  mkdir -p $PUPPETEER_CACHE_DIR
  echo "...Copying Puppeteer Cache from Build Cache"
  cp -R $XDG_CACHE_HOME/puppeteer/ $PUPPETEER_CACHE_DIR
else
  echo "...Storing Puppeteer Cache in Build Cache"
  cp -R $PUPPETEER_CACHE_DIR $XDG_CACHE_HOME
fi