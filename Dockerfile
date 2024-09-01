# ベースイメージを指定
FROM node:16

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    fonts-noto-cjk \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# アプリケーションコードをコピー
COPY . .

# npm依存関係をインストール
RUN npm install

# シェルスクリプトを実行
CMD ["./start.sh"]
