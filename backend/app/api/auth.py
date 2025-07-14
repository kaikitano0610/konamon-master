# konamon-master/backend/api/auth.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from backend.app.models import db, User

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/signup")
def signup():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all([username, email, password]):
        return jsonify(msg="username, email, password 必須です"), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify(msg="すでに登録されています"), 409

    try:
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(msg="登録に失敗しました"), 500

    # 任意：ログイン直後にトークンを返す
    access_token = create_access_token(identity=str(new_user.id))
    refresh_token = create_refresh_token(identity=str(new_user.id))

    return jsonify(msg="登録成功", access=access_token, refresh=refresh_token), 201


@auth_bp.post("/login")
def login():
    data = request.json
    user = User.query.filter_by(username=data.get("username")).first()
    if not user or not user.verify_password(data.get("password")):
        return jsonify(msg="Invalid credentials"), 401

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify(access=access_token, refresh=refresh_token)

@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    new_access = create_access_token(identity=str(user_id))
    return jsonify(access=new_access)


@auth_bp.get("/me")
@jwt_required()
def get_me():
    uid = get_jwt_identity()
    user = User.query.get(str(uid))
    return jsonify(username=user.username, email=user.email)