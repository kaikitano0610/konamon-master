# konamon-master/frontend/Dockerfile
# Node.jsの最新LTSバージョン (20.x) のAlpine Linuxベースイメージを使用
FROM node:20-alpine

# コンテナ内の作業ディレクトリを設定
WORKDIR /app

# package.json と package-lock.json をコンテナにコピー
# これらのファイルが変更されない限り、次のnpm installはキャッシュが使われる
COPY package.json package-lock.json ./

# プロジェクトの依存関係をインストール
# --production フラグは本番環境に必要な依存関係のみをインストールします
# 開発中は削除しても良いですが、イメージサイズを抑えるために推奨
RUN npm install --production

# ホストマシンのすべてのソースコードをコンテナの作業ディレクトリにコピー
COPY . .

# React開発サーバーがリッスンするポート (通常3000) を公開
EXPOSE 3000

# コンテナ起動時に実行されるコマンド
# React開発サーバーを起動
CMD ["npm", "start"]