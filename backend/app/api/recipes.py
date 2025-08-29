import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from backend.app.models import Recipe, db, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.services.translation_service import translate_text

recipes_bp = Blueprint('recipes', __name__, url_prefix='/api/recipes')

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def delete_local_image(filename):
    file_path = os.path.join(current_app.root_path, '..', UPLOAD_FOLDER, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"DEBUG: Local file '{filename}' deleted successfully.")
        except Exception as e:
            print(f"DEBUG: Failed to delete local file '{filename}': {e}")

@recipes_bp.route('/uploads/<filename>')
def serve_image(filename):
    return send_from_directory(os.path.join(current_app.root_path, '..', UPLOAD_FOLDER), filename)

@recipes_bp.route('/', methods=['GET'])
def get_all_recipes():
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
            "title_en": recipe.title_en,
            "ingredients_en": recipe.ingredients_en,
            "instructions_en": recipe.instructions_en,
        })
    return jsonify(output), 200

@recipes_bp.route('/<int:recipe_id>', methods=['GET'])
def get_recipe_detail(recipe_id):
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
        "title_en": recipe.title_en,
        "ingredients_en": recipe.ingredients_en,
        "instructions_en": recipe.instructions_en,
    }), 200

@recipes_bp.route('/', methods=['POST'])
@jwt_required()
def add_recipe():
    current_user_identity = get_jwt_identity()
    try:
        current_user_id = int(current_user_identity)
    except ValueError:
        return jsonify({"message": "無効なユーザーID形式です"}), 400

    photo_url = None
    
    if 'image' in request.files:
        image_file = request.files['image']
        
        # ★ ファイル名が有効か、拡張子があるかを確認する
        if not image_file.filename or not '.' in image_file.filename:
             return jsonify({"message": "画像ファイルが無効です"}), 400

        if image_file and allowed_file(image_file.filename):
            unique_filename = str(uuid.uuid4()) + '.' + secure_filename(image_file.filename).rsplit('.', 1)[1].lower()
            file_path = os.path.join(current_app.root_path, '..', UPLOAD_FOLDER, unique_filename)
            try:
                image_file.save(file_path)
                photo_url = f"/api/recipes/uploads/{unique_filename}"
            except Exception as e:
                return jsonify({"message": f"画像のアップロードに失敗しました: {str(e)}"}), 500
        else:
            return jsonify({"message": "許可されていないファイル形式です"}), 400

    data = request.form

    if not all(k in data for k in ["title", "ingredients", "instructions"]):
        if photo_url:
            delete_local_image(os.path.basename(photo_url))
        return jsonify({"message": "タイトル、材料、作り方は必須です"}), 400

    title_ja = data['title']
    ingredients_ja = data['ingredients']
    instructions_ja = data['instructions']

    title_en = translate_text(title_ja, 'en')
    ingredients_en = translate_text(ingredients_ja, 'en')
    instructions_en = translate_text(instructions_ja, 'en')

    new_recipe = Recipe(
        user_id=current_user_id,
        title=title_ja,
        ingredients=ingredients_ja,
        instructions=instructions_ja,
        title_en=title_en,
        ingredients_en=ingredients_en,
        instructions_en=instructions_en,
        photo_url=photo_url,
        video_url=data.get('video_url'),
        difficulty=data.get('difficulty'),
        prep_time_minutes=int(data.get('prep_time_minutes')) if data.get('prep_time_minutes') else None,
        cook_time_minutes=int(data.get('cook_time_minutes')) if data.get('cook_time_minutes') else None
    )
    db.session.add(new_recipe)
    try:
        db.session.commit()
        return jsonify({"message": "レシピが追加されました", "id": new_recipe.id}), 201
    except Exception as e:
        db.session.rollback()
        if photo_url:
            delete_local_image(os.path.basename(photo_url))
        return jsonify({"message": f"レシピの追加に失敗しました: {str(e)}"}), 500

@recipes_bp.route('/<int:recipe_id>', methods=['PUT'])
@jwt_required()
def update_recipe(recipe_id):
    current_user_identity = get_jwt_identity()
    try:
        current_user_id = int(current_user_identity)
    except ValueError:
        return jsonify({"message": "無効なユーザーID形式です"}), 400

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"message": "レシピが見つかりませんでした"}), 404

    if recipe.user_id != current_user_id:
        return jsonify({"message": "このレシピを編集する権限がありません"}), 403

    data = request.form
    
    new_photo_url = None
    old_photo_url = recipe.photo_url

    if 'image' in request.files and request.files['image'].filename != '':
        image_file = request.files['image']
        # ★ ファイル名が有効か、拡張子があるかを確認する
        if not image_file.filename or not '.' in image_file.filename:
             return jsonify({"message": "画像ファイルが無効です"}), 400

        if allowed_file(image_file.filename):
            unique_filename = str(uuid.uuid4()) + '.' + secure_filename(image_file.filename).rsplit('.', 1)[1].lower()
            file_path = os.path.join(current_app.root_path, '..', UPLOAD_FOLDER, unique_filename)
            try:
                image_file.save(file_path)
                new_photo_url = f"/api/recipes/uploads/{unique_filename}"
                
                if old_photo_url:
                    delete_local_image(os.path.basename(old_photo_url))
            except Exception as e:
                return jsonify({"message": f"新しい画像のアップロードに失敗しました: {str(e)}"}), 500
        else:
            return jsonify({"message": "許可されていない画像ファイル形式です"}), 400
    elif 'photo_url' in data:
        explicit_photo_url_from_form = data.get('photo_url')
        if explicit_photo_url_from_form == '':
            new_photo_url = None
            if old_photo_url:
                delete_local_image(os.path.basename(old_photo_url))
        else:
            new_photo_url = explicit_photo_url_from_form
    else:
        new_photo_url = old_photo_url

    if 'title' in data and data['title'] != recipe.title:
        recipe.title = data['title']
        recipe.title_en = translate_text(recipe.title, 'en')
    
    if 'ingredients' in data and data['ingredients'] != recipe.ingredients:
        recipe.ingredients = data['ingredients']
        recipe.ingredients_en = translate_text(recipe.ingredients, 'en')
    
    if 'instructions' in data and data['instructions'] != recipe.instructions:
        recipe.instructions = data['instructions']
        recipe.instructions_en = translate_text(recipe.instructions, 'en')

    recipe.photo_url = new_photo_url
    recipe.video_url = data.get('video_url', recipe.video_url)
    recipe.difficulty = data.get('difficulty', recipe.difficulty)
    
    prep_time = data.get('prep_time_minutes')
    if prep_time is not None:
        recipe.prep_time_minutes = int(prep_time) if prep_time != '' else None
    
    cook_time = data.get('cook_time_minutes')
    if cook_time is not None:
        recipe.cook_time_minutes = int(cook_time) if cook_time != '' else None

    try:
        db.session.commit()
        return jsonify({"message": "レシピが更新されました"}), 200
    except Exception as e:
        db.session.rollback()
        if new_photo_url and new_photo_url != old_photo_url and 'image' in request.files:
            delete_local_image(os.path.basename(new_photo_url))
        return jsonify({"message": f"レシピの更新に失敗しました: {str(e)}"}), 500

@recipes_bp.route('/<int:recipe_id>', methods=['DELETE'])
@jwt_required()
def delete_recipe(recipe_id):
    current_user_identity = get_jwt_identity()
    try:
        current_user_id = int(current_user_identity)
    except ValueError:
        return jsonify({"message": "無効なユーザーID形式です"}), 400

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"message": "レシピが見つかりませんでした"}), 404

    if recipe.user_id != current_user_id:
        return jsonify({"message": "このレシピを削除する権限がありません"}), 403

    if recipe.photo_url:
        delete_local_image(os.path.basename(recipe.photo_url))

    try:
        db.session.delete(recipe)
        db.session.commit()
        return jsonify({"message": "レシピが削除されました"}), 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"レシピの削除に失敗しました: {str(e)}"}), 500