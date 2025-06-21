# konamon-master/backend/app.py

from flask import Flask, jsonify
from flask_cors import CORS
import os

# Blueprintのインポート (後で作成するapiモジュールから)
from api.shops import shops_bp # api/shops.pyで定義するBlueprint
from api.auth import auth_bp   # api/auth.pyで定義するBlueprint

app = Flask(__name__)
CORS(app) # 全てのオリジンからのCORSリクエストを許可 (開発用)

# ===============================================
# アプリケーション設定
# ===============================================
# 環境変数からシークレットキーを読み込む
# FlaskのセッションやCSRF保護などに利用
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'your_super_secret_key') # 開発時は適当なキー、本番は強固なもの

# ===============================================
# Blueprintの登録
# ===============================================
# 各APIのBlueprintをアプリケーションに登録する
app.register_blueprint(shops_bp, url_prefix='/api/shops') # /api/shops/... でアクセス
app.register_blueprint(auth_bp, url_prefix='/api/auth')   # /api/auth/... でアクセス


# ===============================================
# ルート定義 (直接 app.py に定義するシンプルなもの)
# ===============================================
@app.route('/')
def home():
    """アプリケーションのルートパス"""
    return "Hello from Konamon App Backend!"

@app.route('/health')
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({"status": "ok", "message": "Backend is running!"}), 200

# ===============================================
# アプリケーション起動
# ===============================================
if __name__ == '__main__':
    # debug=True は開発中に便利ですが、本番環境ではFalseにしてください
    # host='0.0.0.0' は、Dockerコンテナ内で外部からのアクセスを許可するために必要
    app.run(debug=True, host='0.0.0.0', port=5000)