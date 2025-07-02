# konamon-master/backend/api/users.py
from flask import Blueprint, request, jsonify
from backend.app.models import User

users_bp = Blueprint('users', __name__)

# ------------------------------------------------------------
# ユーザ一覧を返す
#    GET /api/users/
# ------------------------------------------------------------
@users_bp.route("/", methods=["GET"])
def get_all_users():
    user = User.query.all() 

    def to_dict(user: User):
        return {
            "id":   user.id,
            "username": user.username,
        }

    return jsonify([to_dict(s) for s in user]), 200