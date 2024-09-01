# ベースイメージを指定
FROM node:20

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    fonts-noto-cjk \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# アプリケーションコードをコピー
COPY . .

# Puppeteerキャッシュ処理用のビルドスクリプトを作成
RUN echo '#!/usr/bin/env bash\n\
# exit on errorset -o errexit\n\
\n\
npm install\n\
# npm run build # uncomment if required\n\
\n\
# Store/pull Puppeteer cache with build cache\n\
if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then \n\
  echo "...Copying Puppeteer Cache from Build Cache" \n\
  cp -R $XDG_CACHE_HOME/puppeteer/ $PUPPETEER_CACHE_DIR \n\
else \n\
  echo "...Storing Puppeteer Cache in Build Cache" \n\
  cp -R $PUPPETEER_CACHE_DIR $XDG_CACHE_HOME \n\
fi' > /usr/src/app/build-script.sh

# スクリプトを実行可能にする
RUN chmod +x /usr/src/app/build-script.sh

# シェルスクリプトを実行
RUN /usr/src/app/build-script.sh

# start.shを実行可能にする
RUN chmod +x ./start.sh

# シェルスクリプトを実行
CMD ["./start.sh"]
