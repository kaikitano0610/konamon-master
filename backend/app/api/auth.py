# backend/api/auth.py

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app.models import User, db
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "ユーザー名、メール、パスワードは必須です"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "このユーザー名は既に使用されています"}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "このメールアドレスは既に使用されています"}), 409

    hashed_password = generate_password_hash(password)

    new_user = User(username=username, email=email, password_hash=hashed_password)
    db.session.add(new_user)
    try:
        db.session.commit()
        # ★ここを修正: new_user.id を str() で文字列に変換
        access_token = create_access_token(identity=str(new_user.id))
        return jsonify({
            "message": "ユーザー登録が成功しました",
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email
            },
            "access_token": access_token
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"ユーザー登録に失敗しました: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "ユーザー名とパスワードは必須です"}), 400

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password):
        # ★ここを修正: user.id を str() で文字列に変換
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "message": "ログイン成功",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "access_token": access_token
        }), 200
    else:
        return jsonify({"message": "無効なユーザー名またはパスワードです"}), 401
