import os
import uuid
import boto3
from flask import Blueprint, request, jsonify
from backend.app.models import Recipe, db, User
from flask_jwt_extended import jwt_required, get_jwt_identity

recipes_bp = Blueprint('recipes', __name__, url_prefix='/api/recipes')

# S3クライアントの初期化
# 環境変数は.env.backendから読み込まれます。
s3 = boto3.client(
    's3',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    region_name=os.environ.get('S3_REGION')
)
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'} # 許可する画像拡張子

def allowed_file(filename):
    """
    アップロードされたファイルの拡張子が許可されているかチェックするヘルパー関数
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def delete_s3_object(url):
    """
    S3から指定されたURLのオブジェクトを削除するヘルパー関数
    """
    if url and S3_BUCKET_NAME in url: # S3のURLであるかを確認
        try:
            key_name = url.split('/')[-1]
            s3.delete_object(Bucket=S3_BUCKET_NAME, Key=key_name)
            print(f"DEBUG: S3 object '{key_name}' deleted successfully.")
        except Exception as e:
            print(f"DEBUG: Failed to delete S3 object '{key_name}': {e}")
            # エラーをログに記録するが、処理は続行する（DBの整合性を優先）

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
@jwt_required()
def add_recipe():
    """
    レシピ追加API (ログイン必須、画像アップロード対応)
    リクエストボディ: FormData (JSONデータとファイル)
    """
    current_user_identity = get_jwt_identity()
    try:
        current_user_id = int(current_user_identity)
    except ValueError:
        return jsonify({"message": "無効なユーザーID形式です"}), 400

    photo_url = None
    unique_filename = None # エラー時のS3削除のためにファイル名を保持

    # ファイルのチェックとアップロード
    # フロントエンドから 'image' というキー名でファイルが送られることを想定
    if 'image' in request.files:
        image_file = request.files['image']
        
        # ファイルが選択されているかチェック
        if image_file.filename == '':
            return jsonify({"message": "ファイルが選択されていません"}), 400
        
        # 許可されたファイル形式かチェック
        if image_file and allowed_file(image_file.filename):
            original_filename = image_file.filename
            # UUIDを使って一意なファイル名を生成
            unique_filename = str(uuid.uuid4()) + '.' + original_filename.rsplit('.', 1)[1].lower()
            
            try:
                # S3にファイルをアップロード
                s3.upload_fileobj(
                    image_file,
                    S3_BUCKET_NAME,
                    unique_filename,
                    ExtraArgs={'ContentType': image_file.content_type, 'ACL': 'public-read'} # public-read で公開アクセス可能に
                )
                # アップロードされた画像のURLを生成
                photo_url = f"https://{S3_BUCKET_NAME}.s3.{os.environ.get('S3_REGION')}.amazonaws.com/{unique_filename}"
            except Exception as e:
                # S3アップロードエラー
                return jsonify({"message": f"画像のアップロードに失敗しました: {str(e)}"}), 500
        else:
            # 許可されていないファイル形式の場合
            return jsonify({"message": "許可されていないファイル形式です"}), 400

    # その他のJSONデータは request.form から取得 (FormDataの場合)
    # request.get_json() は multipart/form-data では使用できません
    data = request.form

    # 必須フィールドのチェック
    if not all(k in data for k in ["title", "ingredients", "instructions"]):
        # 画像アップロードが成功していても、必須フィールドがなければS3の画像を削除すべき
        if photo_url: # unique_filenameはphoto_urlに含まれるため不要
            delete_s3_object(photo_url)
        return jsonify({"message": "タイトル、材料、作り方は必須です"}), 400

    new_recipe = Recipe(
        user_id=current_user_id,
        title=data['title'],
        ingredients=data['ingredients'],
        instructions=data['instructions'],
        photo_url=photo_url, # S3から取得したURLを設定
        video_url=data.get('video_url'), # FormDataでは null は送れないため、空文字列が来る可能性も考慮
        difficulty=data.get('difficulty'),
        # 数値型に変換
        prep_time_minutes=int(data.get('prep_time_minutes')) if data.get('prep_time_minutes') else None,
        cook_time_minutes=int(data.get('cook_time_minutes')) if data.get('cook_time_minutes') else None
    )
    db.session.add(new_recipe)
    try:
        db.session.commit()
        return jsonify({"message": "レシピが追加されました", "id": new_recipe.id}), 201
    except Exception as e:
        db.session.rollback()
        # DBコミット失敗時に、S3にアップロードした画像を削除する
        if photo_url:
            delete_s3_object(photo_url)
        return jsonify({"message": f"レシピの追加に失敗しました: {str(e)}"}), 500

@recipes_bp.route('/<int:recipe_id>', methods=['PUT'])
@jwt_required()
def update_recipe(recipe_id):
    """
    レシピ編集API (ログイン必須、かつ所有者のみ、画像アップロード対応)
    リクエストボディ: FormData (テキストデータとファイル)
    """
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

    # FormDataからデータを取得
    data = request.form
    
    # 画像ファイルの処理
    new_photo_url = None
    old_photo_url = recipe.photo_url # 更新前の既存の画像URL

    if 'image' in request.files and request.files['image'].filename != '':
        # 新しい画像ファイルがアップロードされた場合
        image_file = request.files['image']
        if allowed_file(image_file.filename):
            original_filename = image_file.filename
            unique_filename = str(uuid.uuid4()) + '.' + original_filename.rsplit('.', 1)[1].lower()
            try:
                s3.upload_fileobj(
                    image_file,
                    S3_BUCKET_NAME,
                    unique_filename,
                    ExtraArgs={'ContentType': image_file.content_type, 'ACL': 'public-read'}
                )
                new_photo_url = f"https://{S3_BUCKET_NAME}.s3.{os.environ.get('S3_REGION')}.amazonaws.com/{unique_filename}"
                
                # 古い画像をS3から削除
                if old_photo_url:
                    delete_s3_object(old_photo_url)
            except Exception as e:
                return jsonify({"message": f"新しい画像のアップロードに失敗しました: {str(e)}"}), 500
        else:
            return jsonify({"message": "許可されていない画像ファイル形式です"}), 400
    elif 'photo_url' in data:
        # 新しい画像ファイルはないが、photo_urlフィールドがFormDataにある場合
        # これは、ユーザーが既存のURLを直接編集したか、クリアした可能性がある
        explicit_photo_url_from_form = data.get('photo_url')
        if explicit_photo_url_from_form == '':
            # ユーザーが画像を削除したい場合
            new_photo_url = None
            if old_photo_url:
                delete_s3_object(old_photo_url)
        else:
            # ユーザーが新しいURLを直接入力した場合、または既存のURLをそのまま維持した場合
            new_photo_url = explicit_photo_url_from_form
            # ここではS3の古い画像を削除しない。なぜなら、ユーザーがURLを編集しただけで、
            # 新しいS3画像がアップロードされたわけではないため。
            # （例: 入力されたURLがS3の既存画像と異なり、かつそれがS3の画像であれば、
            # 古いS3画像を削除するロジックはより複雑になるため、今回は省略。）
    else:
        # imageファイルもphoto_urlフォームフィールドも提供されていない場合、既存のURLを維持
        new_photo_url = old_photo_url

    # レシピデータを更新
    recipe.title = data.get('title', recipe.title)
    recipe.ingredients = data.get('ingredients', recipe.ingredients)
    recipe.instructions = data.get('instructions', recipe.instructions)
    recipe.photo_url = new_photo_url # 更新された写真URLを設定
    recipe.video_url = data.get('video_url', recipe.video_url)
    recipe.difficulty = data.get('difficulty', recipe.difficulty)
    
    # 数値型に変換して更新
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
        # DBコミット失敗時に、新しくアップロードした画像を削除する（もしあれば）
        # new_photo_url が old_photo_url と異なり、かつ 'image' ファイルがリクエストに含まれていた場合のみ
        if new_photo_url and new_photo_url != old_photo_url and 'image' in request.files:
            delete_s3_object(new_photo_url)
        return jsonify({"message": f"レシピの更新に失敗しました: {str(e)}"}), 500

@recipes_bp.route('/<int:recipe_id>', methods=['DELETE'])
@jwt_required()
def delete_recipe(recipe_id):
    """
    レシピ削除API (ログイン必須、かつ所有者のみ)
    レシピ削除時にS3の画像も削除するように拡張
    """
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

    # S3画像の削除処理
    if recipe.photo_url:
        delete_s3_object(recipe.photo_url)

    try:
        db.session.delete(recipe)
        db.session.commit()
        return jsonify({"message": "レシピが削除されました"}), 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"レシピの削除に失敗しました: {str(e)}"}), 500
