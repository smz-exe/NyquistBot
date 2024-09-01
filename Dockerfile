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

# スクリプトを実行可能にする
RUN chmod +x ./render-build.sh

# シェルスクリプトを実行
RUN ./render-build.sh

# start.shを実行可能にする
RUN chmod +x ./start.sh

# シェルスクリプトを実行
CMD ["./start.sh"]
