from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from backend.app.api.shops import shops_bp
from backend.app.api.auth import auth_bp
from backend.app.extensions import db, migrate
from backend.app.extensions import jwt
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

    jwt.init_app(app)

    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "change-this-key")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 900           # 15 min
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 86400         # 1 day

    db.init_app(app)
    migrate.init_app(app, db)

    # Blueprint登録
    app.register_blueprint(shops_bp, url_prefix='/api/shops')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    @app.route('/')
    def home():
        return "Hello from Konamon App Backend!"

    @app.route('/health')
    def health_check():
        return jsonify({"status": "ok", "message": "Backend is running!"}), 200

    return app
