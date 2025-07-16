import os
import uuid
import boto3
from flask import Blueprint, request, jsonify
from backend.app.models import Recipe, db, User
from flask_jwt_extended import jwt_required, get_jwt_identity

recipes_bp = Blueprint('recipes', __name__, url_prefix='/api/recipes') # ★ここを '/api/recipes' に修正しました

# S3クライアントの初期化
# アプリケーション起動時に一度だけ初期化されるように、適切に配置することが望ましいですが、
# 今回は簡便のため、Blueprintのスコープに直接記述します。
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
    current_user_id = get_jwt_identity()

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
                # region_nameはs3クライアント初期化時に設定済みなので、それを使用
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
        if photo_url and unique_filename:
            try:
                s3.delete_object(Bucket=S3_BUCKET_NAME, Key=unique_filename)
            except Exception as delete_e:
                print(f"DEBUG: 必須フィールド不足時にS3オブジェクト削除失敗: {delete_e}")
        return jsonify({"message": "タイトル、材料、作り方は必須です"}), 400

    new_recipe = Recipe(
        user_id=current_user_id,
        title=data['title'],
        ingredients=data['ingredients'],
        instructions=data['instructions'],
        photo_url=photo_url, # S3から取得したURLを設定
        video_url=data.get('video_url'), # FormDataでは null は送れないため、空文字列が来る可能性も考慮
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
        # DBコミット失敗時に、S3にアップロードした画像を削除する
        if photo_url and unique_filename:
            try:
                s3.delete_object(Bucket=S3_BUCKET_NAME, Key=unique_filename)
            except Exception as delete_e:
                print(f"DEBUG: DBコミット失敗時にS3オブジェクト削除失敗: {delete_e}") # デバッグ用にログ出力
        return jsonify({"message": f"レシピの追加に失敗しました: {str(e)}"}), 500

@recipes_bp.route('/<int:recipe_id>', methods=['PUT'])
@jwt_required()
def update_recipe(recipe_id):
    """
    レシピ編集API (ログイン必須、かつ所有者のみ)
    PUTリクエストではファイルアップロードは想定しない (別途エンドポイントを設けるか、複雑化を避ける)
    リクエストボディ: { "title": "...", "ingredients": "...", ... }
    """
    current_user_id = get_jwt_identity()
    data = request.get_json() # PUTではget_json()を使う想定

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"message": "レシピが見つかりませんでした"}), 404

    if recipe.user_id != current_user_id:
        return jsonify({"message": "このレシピを編集する権限がありません"}), 403

    recipe.title = data.get('title', recipe.title)
    recipe.ingredients = data.get('ingredients', recipe.ingredients)
    recipe.instructions = data.get('instructions', recipe.instructions)
    # PUTではphoto_urlの変更はJSON経由で行うか、画像変更用の別APIを設ける
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
@jwt_required()
def delete_recipe(recipe_id):
    """
    レシピ削除API (ログイン必須、かつ所有者のみ)
    レシピ削除時にS3の画像も削除するように拡張
    """
    current_user_id = get_jwt_identity()

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"message": "レシピが見つかりませんでした"}), 404

    if recipe.user_id != current_user_id:
        return jsonify({"message": "このレシピを削除する権限がありません"}), 403

    # S3画像の削除処理
    if recipe.photo_url:
        try:
            # S3 URLからキー名を抽出
            # 例: https://konamon-recipe-images.s3.ap-northeast-1.amazonaws.com/abc-123.jpg
            # -> キー名: abc-123.jpg
            key_name = recipe.photo_url.split('/')[-1]
            s3.delete_object(Bucket=S3_BUCKET_NAME, Key=key_name)
        except Exception as e:
            # S3からの削除に失敗してもDBは削除したいので、エラーをログに記録するだけに留める
            print(f"DEBUG: S3オブジェクトの削除に失敗しました: {e}")
            # エラーを返す場合はreturn jsonify(...) を追加

    try:
        db.session.delete(recipe)
        db.session.commit()
        return jsonify({"message": "レシピが削除されました"}), 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"レシピの削除に失敗しました: {str(e)}"}), 500