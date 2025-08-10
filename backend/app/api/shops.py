# konamon-master/backend/api/shops.py
from flask import Blueprint, request, jsonify
from backend.app.models import Shop
# ★ get_place_detailの言語パラメータに対応するためインポート
from backend.app.services.google_places_service import text_search, get_place_detail
# ★ 翻訳サービスをインポート
from backend.app.services.translation_service import translate_text

shops_bp = Blueprint('shops', __name__)

# ------------------------------------------------------------
# 店舗一覧を返す
#    GET /api/shops/
# ------------------------------------------------------------
@shops_bp.route("/", methods=["GET"])
def get_all_shops():
    # ★ フロントエンドから言語設定を取得
    lang = request.args.get('lang', 'ja')

    shops = Shop.query.all()

    def to_dict(shop: Shop):
        # ★ 言語設定に応じて name と description を切り替える
        name = shop.name if lang == 'ja' else shop.name_en
        description = shop.description if lang == 'ja' else shop.description_en

        return {
            "id":   shop.id,
            "name": name,
            "recommended_reason": description,
            "congestion_status": (
                shop.realtime_status.current_status.value
                if shop.realtime_status else None
            ),
        }

    return jsonify([to_dict(s) for s in shops]), 200

# ------------------------------------------------------------
# prompt で Google Places を検索
#    POST /api/shops/recommend   body: {"prompt": "..."}
# ------------------------------------------------------------
@shops_bp.route("/recommend", methods=["POST"])
def recommend_shops_by_mood():
    payload = request.get_json(force=True, silent=True) or {}
    mood_query = (payload.get("mood_query") or "").strip()
    food_type = (payload.get("food_type") or "").strip()
    # ★ ここで言語設定を取得。
    # フロントエンドからリクエストヘッダーやボディで送られることを想定。
    lang = payload.get('lang', 'ja')

    if not mood_query:
        return jsonify({"error": ("Mood query is required.")}), 400

    # ★ text_search関数に言語パラメータを渡す
    return jsonify(text_search(mood_query, food_type, lang=lang)), 200

# ------------------------------------------------------------
# Google Place の詳細を返す
#    GET /api/shops/<place_id>
# ------------------------------------------------------------
@shops_bp.route("/<place_id>", methods=["GET"])
def get_external_shop_detail(place_id):
    # ★ フロントエンドから言語設定を取得
    lang = request.args.get('lang', 'ja')
    
    # ★ get_place_detail関数に言語パラメータを渡す
    detail = get_place_detail(place_id, lang=lang)
    if detail is None:
        return jsonify({"error": "not found"}), 404
    return jsonify(detail), 200