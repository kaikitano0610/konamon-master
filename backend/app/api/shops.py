# konamon-master/backend/api/shops.py
from flask import Blueprint, request, jsonify
from backend.app.models import Shop
from backend.app.services.google_places_service import text_search, get_place_detail
from backend.app.services.openai_service import generate_search_queries

shops_bp = Blueprint('shops', __name__)

# ------------------------------------------------------------
# 店舗一覧を返す
#    GET /api/shops/
# ------------------------------------------------------------
@shops_bp.route("/", methods=["GET"])
def get_all_shops():
    shops = Shop.query.all() 

    def to_dict(shop: Shop):
        return {
            "id":   shop.id,
            "name": shop.name,
            "recommended_reason": shop.description,
            "congestion_status": (
                shop.realtime_status.current_status.value
                if shop.realtime_status else None
            ),
        }

    return jsonify([to_dict(s) for s in shops]), 200

# ------------------------------------------------------------
# prompt で Google Places を検索
#    POST /api/shops/recommend   body: {"prompt": "..."}
# ------------------------------------------------------------
@shops_bp.route("/recommend", methods=["POST"])
def recommend_shops_by_mood(): # 関数名は機能に合わせて変更
    payload = request.get_json(force=True, silent=True) or {}
    # prompt ではなく mood_query を取得
    mood_query = (payload.get("mood_query") or "").strip() 
    food_type = (payload.get("food_type") or "").strip() 

    if not mood_query:
        return jsonify({"error": ("Mood query is required.")}), 400

    generated_queries = generate_search_queries(mood_query, food_type)

    all_shops = []
    # 生成された各クエリでGoogle Placesを検索
    for query in generated_queries:
        # text_searchの第一引数をqueryに置き換え
        shops_from_query = text_search(query, limit=5)
        all_shops.extend(shops_from_query)

    # 重複を排除して、結果を返す
    unique_shops = {shop['place_id']: shop for shop in all_shops}.values()
    return jsonify(list(unique_shops)), 200

# ------------------------------------------------------------
# Google Place の詳細を返す
#    GET /api/shops/<place_id>
# ------------------------------------------------------------
@shops_bp.route("/<place_id>", methods=["GET"])
def get_external_shop_detail(place_id):
    detail = get_place_detail(place_id)
    if detail is None:
        return jsonify({"error": "not found"}), 404
    return jsonify(detail), 200