# backend/app/services/google_places_service.py

import os
import requests
import logging
from typing import Tuple, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Text Search API用の設定 ---
TEXT_SEARCH_API_ENDPOINT = "https://maps.googleapis.com/maps/api/place/textsearch/json"

# --- Place Details API用の設定を追加 ---
PLACE_DETAILS_API_ENDPOINT = "https://maps.googleapis.com/maps/api/place/details/json"

def search_nearby_shops(    keyword: str, 
    lat: float, 
    lon: float, 
    radius: int = 1000,
    min_price: int = None,      # ★追加
    max_price: int = None,      # ★追加
    open_now: bool = False,     # ★追加
    page_token: str = None,      # ★追加
    **kwargs
) -> Tuple[Dict[str, Any], int]:
    """
    指定されたキーワードと位置情報でGoogle Places API (Text Search)を検索する
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "API key is not configured"}, 500

    params = {
        "query": keyword,
        "language": "ja",
        "key": api_key,
        **kwargs # 他のパラメータを受け取れるように
    }
    # page_tokenが指定されている場合は、他の条件は不要
    if page_token:
        params["pagetoken"] = page_token
    else:
        # page_tokenがない場合のみ、他の条件を設定
        params["location"] = f"{lat},{lon}"
        params["radius"] = radius
        params["type"] = "restaurant"
        if min_price is not None and 0 <= min_price <= 4:
            params["minprice"] = min_price
        if max_price is not None and 0 <= max_price <= 4:
            params["maxprice"] = max_price
        if open_now:
            params["opennow"] = "true"

    try:
        response = requests.get(TEXT_SEARCH_API_ENDPOINT, params=params, timeout=5)
        response.raise_for_status() # HTTPエラーがあれば例外を発生
        return response.json(), 200
    except requests.exceptions.RequestException as e:
        print(f"Error calling Google Places API: {e}")
        return {"error": "Failed to communicate with external service"}, 503
    

# ★★★ 詳細情報を取得するための新しい関数を追加 ★★★
def get_shop_details(place_id: str) -> Tuple[Dict[str, Any], int]:
    """
    指定されたplace_idのお店の詳細情報を取得する
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        logger.error("API key (GOOGLE_API_KEY) is not configured.")
        return {"error": "API key is not configured"}, 500

    # fieldsパラメータで欲しい情報を指定する
    fields = "place_id,name,formatted_address,geometry,rating,user_ratings_total,reviews,photos,opening_hours,website,formatted_phone_number"
    
    params = {
        "place_id": place_id,
        "fields": fields,
        "language": "ja",
        "key": api_key
    }

    try:
        response = requests.get(PLACE_DETAILS_API_ENDPOINT, params=params, timeout=5)
        response.raise_for_status()
        
        try:
            return response.json(), 200
        except requests.exceptions.JSONDecodeError:
            logger.error("Failed to decode JSON from Google Place Details API response.")
            return {"error": "Invalid response from external service"}, 502
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Google Place Details API: {e}")
        return {"error": "Failed to communicate with external service"}, 503