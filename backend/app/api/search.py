# backend/app/api/search.py

from flask import Blueprint, request, jsonify
# サービス層から2つの関数をインポートします
from backend.app.services.google_places_service import search_nearby_shops, get_shop_details
import json

# 新しいBlueprintを作成
search_bp = Blueprint('search', __name__)

@search_bp.route('/search', methods=['GET', 'POST'])
def handle_search():
    keyword = None
    lat = None
    lon = None

    # リクエストのメソッドに応じて、データの取得方法を切り替える
    if request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        keyword = data.get("keyword")
        lat = data.get("lat")
        lon = data.get("lon")
    else:  # GETリクエストの場合
        # URLのクエリパラメータ(?keyword=...など)からデータを取得
        keyword = request.args.get("keyword")
        lat_str = request.args.get("lat")
        lon_str = request.args.get("lon")
        
        # GETで受け取ったパラメータは全て文字列なので、数値に変換する
        try:
            if lat_str: lat = float(lat_str)
            if lon_str: lon = float(lon_str)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid lat/lon parameters. They must be numbers."}), 400

    # 必須パラメータが揃っているかチェック
    if not all([keyword, lat, lon]):
        return jsonify({"error": "Missing required parameters: keyword, lat, lon"}), 400

    # --- ここからが新しいロジックです ---

    # 1. まずはText Search APIで、お店のリストを検索
    list_results, status_code = search_nearby_shops(keyword, lat, lon)

    # 検索でエラーが発生した場合は、そのエラーをそのまま返す
    if status_code != 200:
        return jsonify(list_results), status_code

    # 2. 検索結果のリストから、先頭の最大2件を取得
    shops_to_get_details = list_results.get("results", [])[:2]
    
    detailed_shops = []
    # 3. 取得した2件のお店について、ループで詳細情報を取得
    for shop in shops_to_get_details:
        place_id = shop.get("place_id")
        if place_id:
            # Place Details APIを呼び出す
            details_result, details_status_code = get_shop_details(place_id)
            
            # 詳細情報の取得に成功した場合のみ、結果をリストに追加
            if details_status_code == 200:
                # Place Details APIのレスポンスは "result" キーの中に本体が入っている
                detailed_shops.append(details_result.get("result"))

    # 4. 詳細情報が詰まったリストをJSONとして返す
    return jsonify(detailed_shops)
