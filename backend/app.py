# konamon-master/backend/app.py

from flask import Flask, jsonify
from flask_cors import CORS
import os

# Blueprintのインポート (相対インポートに変更)
# backendパッケージのルートからの相対パスで指定します
from .api.shops import shops_bp
from .api.auth import auth_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    # ===============================================
    # アプリケーション設定
    # ===============================================
    app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key_please_change')

    # ===============================================
    # Blueprintの登録
    # ===============================================
    # 各APIのBlueprintをアプリケーションに登録する
    app.register_blueprint(shops_bp, url_prefix='/api/shops')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

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

    return app

# flask run コマンドがこのファイルをインポートした際に、
# create_app() 関数を呼び出してアプリケーションインスタンスを取得できるようになる。
# __name__ == '__main__': ブロックは削除したままでOK