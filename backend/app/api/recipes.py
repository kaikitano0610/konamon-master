from flask import Blueprint, request, jsonify
from functools import wraps # @wraps はカスタムデコレータを使う場合に必要だが、今回は削除される
from backend.app.models import Recipe, db, User # Userモデルも引き続き必要
from flask_jwt_extended import jwt_required, get_jwt_identity # ★jwt_required, get_jwt_identity をインポート

recipes_bp = Blueprint('recipes', __name__, url_prefix='/recipes')

@recipes_bp.route('/', methods=['GET'])
def get_all_recipes():
    """
    全レシピの一覧取得API (ログイン不要)
    """
    recipes = Recipe.query.all()
    output = []
    for recipe in recipes:
        output.append({
            "id": recipe.id,
            "user_id": recipe.user_id,
            "title": recipe.title,
            "ingredients": recipe.ingredients,
            "instructions": recipe.instructions,
            "photo_url": recipe.photo_url,
            "video_url": recipe.video_url,
            "difficulty": recipe.difficulty,
            "prep_time_minutes": recipe.prep_time_minutes,
            "cook_time_minutes": recipe.cook_time_minutes,
            "created_at": recipe.created_at.isoformat() if recipe.created_at else None,
            "updated_at": recipe.updated_at.isoformat() if recipe.updated_at else None,
        })
    return jsonify(output), 200

@recipes_bp.route('/<int:recipe_id>', methods=['GET'])
def get_recipe_detail(recipe_id):
    """
    特定のレシピの詳細取得API (ログイン不要)
    """
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"message": "レシピが見つかりませんでした"}), 404

    return jsonify({
        "id": recipe.id,
        "user_id": recipe.user_id,
        "title": recipe.title,
        "ingredients": recipe.ingredients,
        "instructions": recipe.instructions,
        "photo_url": recipe.photo_url,
        "video_url": recipe.video_url,
        "difficulty": recipe.difficulty,
        "prep_time_minutes": recipe.prep_time_minutes,
        "cook_time_minutes": recipe.cook_time_minutes,
        "created_at": recipe.created_at.isoformat() if recipe.created_at else None,
        "updated_at": recipe.updated_at.isoformat() if recipe.updated_at else None,
    }), 200

@recipes_bp.route('/', methods=['POST'])
@jwt_required() # ★ここを @jwt_required() に変更
def add_recipe():
    """
    レシピ追加API (ログイン必須)
    リクエストボディ: { "title": "...", "ingredients": "...", "instructions": "...", ... }
    """
    # ★トークンからユーザーIDを取得
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # 必須フィールドのチェック
    if not all(k in data for k in ["title", "ingredients", "instructions"]):
        return jsonify({"message": "タイトル、材料、作り方は必須です"}), 400

    new_recipe = Recipe(
        user_id=current_user_id, # ★取得したユーザーIDを使用
        title=data['title'],
        ingredients=data['ingredients'],
        instructions=data['instructions'],
        photo_url=data.get('photo_url'),
        video_url=data.get('video_url'),
        difficulty=data.get('difficulty'),
        prep_time_minutes=data.get('prep_time_minutes'),
        cook_time_minutes=data.get('cook_time_minutes')
    )
    db.session.add(new_recipe)
    try:
        db.session.commit()
        return jsonify({"message": "レシピが追加されました", "id": new_recipe.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"レシピの追加に失敗しました: {str(e)}"}), 500

@recipes_bp.route('/<int:recipe_id>', methods=['PUT'])
@jwt_required() # ★ここを @jwt_required() に変更
def update_recipe(recipe_id):
    """
    レシピ編集API (ログイン必須、かつ所有者のみ)
    リクエストボディ: { "title": "...", "ingredients": "...", ... }
    """
    # ★トークンからユーザーIDを取得
    current_user_id = get_jwt_identity()
    data = request.get_json()

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"message": "レシピが見つかりませんでした"}), 404

    # レシピの所有者であるかチェック
    # get_jwt_identity() は identity に渡した型（ここではint）で返す
    if recipe.user_id != current_user_id:
        return jsonify({"message": "このレシピを編集する権限がありません"}), 403

    recipe.title = data.get('title', recipe.title)
    recipe.ingredients = data.get('ingredients', recipe.ingredients)
    recipe.instructions = data.get('instructions', recipe.instructions)
    recipe.photo_url = data.get('photo_url', recipe.photo_url)
    recipe.video_url = data.get('video_url', recipe.video_url)
    recipe.difficulty = data.get('difficulty', recipe.difficulty)
    recipe.prep_time_minutes = data.get('prep_time_minutes', recipe.prep_time_minutes)
    recipe.cook_time_minutes = data.get('cook_time_minutes', recipe.cook_time_minutes)

    try:
        db.session.commit()
        return jsonify({"message": "レシピが更新されました"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"レシピの更新に失敗しました: {str(e)}"}), 500

@recipes_bp.route('/<int:recipe_id>', methods=['DELETE'])
@jwt_required() # ★ここを @jwt_required() に変更
def delete_recipe(recipe_id):
    """
    レシピ削除API (ログイン必須、かつ所有者のみ)
    """
    # ★トークンからユーザーIDを取得
    current_user_id = get_jwt_identity()

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"message": "レシピが見つかりませんでした"}), 404

    # レシピの所有者であるかチェック
    if recipe.user_id != current_user_id:
        return jsonify({"message": "このレシピを削除する権限がありません"}), 403

    try:
        db.session.delete(recipe)
        db.session.commit()
        return jsonify({"message": "レシピが削除されました"}), 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"レシピの削除に失敗しました: {str(e)}"}), 500
