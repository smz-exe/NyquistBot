#!/usr/bin/env bash
# exit on errorset -o errexit

# .envファイルの場所を検索してログに出力
env_file_path=$(find / -name ".env" 2>/dev/null)

if [ -n "$env_file_path" ]; then
  echo ".env file found at: $env_file_path"
else
  echo ".env file not found"
fi

# .envファイルの読み込み
if [ -f "$env_file_path" ]; then
  set -o allexport
  source "$env_file_path"
  set +o allexport
fi

echo "PUPPETEER_CACHE_DIR is set to: $PUPPETEER_CACHE_DIR"

npm install
npx puppeteer install

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