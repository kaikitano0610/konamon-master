# konamon-master/backend/api/auth.py
from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    # ここに認証ロジックを実装（ユーザーDBから確認など）
    if username == 'test' and password == 'password': # 仮の認証
        return jsonify({"message": "Login successful", "token": "fake-token-123"}), 200
    return jsonify({"message": "Invalid credentials"}), 401