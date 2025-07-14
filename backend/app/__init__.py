from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager 
from backend.app.api.shops import shops_bp
from backend.app.api.auth import auth_bp
from backend.app.api.recipes import recipes_bp
from backend.app.extensions import db, migrate
import os

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"mysql+pymysql://{os.environ.get('DB_USER')}:{os.environ.get('DB_PASSWORD')}"
        f"@{os.environ.get('DB_HOST')}:{os.environ.get('DB_PORT')}/{os.environ.get('DB_NAME')}"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key_please_change')

    # --- JWT_SECRET_KEY の設定 ---
    # .env.backend ファイルに JWT_SECRET_KEY=あなたの強力なシークレットキー を追加してください
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY") # JWTの署名に使用する秘密鍵
    # トークンの有効期限 (例: 1時間)
    # from datetime import timedelta
    # app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)


    # Flask-JWT-Extended を初期化
    jwt = JWTManager(app) # ★この行を追加！

    db.init_app(app)
    migrate.init_app(app, db)

    # Blueprint登録
    app.register_blueprint(shops_bp, url_prefix='/api/shops')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(recipes_bp, url_prefix='/api/recipes')

    @app.route('/')
    def home():
        return "Hello from Konamon App Backend!"

    @app.route('/health')
    def health_check():
        return jsonify({"status": "ok", "message": "Backend is running!"}), 200

    return app
