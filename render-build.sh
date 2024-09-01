#!/usr/bin/env bash
# exit on errorset -o errexit

npm install
# npm run build # uncomment if required

# Install Japanese fonts using a different method if apt-get is not available
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update && sudo apt-get install -y fonts-noto-cjk
else
    echo "apt-get is not available. Please use a Dockerfile to install fonts."
fi

# Store/pull Puppeteer cache with build cache
if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then
  echo "...Copying Puppeteer Cache from Build Cache"
  cp -R $XDG_CACHE_HOME/puppeteer/ $PUPPETEER_CACHE_DIR
else
  echo "...Storing Puppeteer Cache in Build Cache"
  cp -R $PUPPETEER_CACHE_DIR $XDG_CACHE_HOME
fi