# backend/app/api/nearby.py

from flask import Blueprint, request, jsonify
import os
import requests
from datetime import datetime
import pytz
from backend.app.services.google_places_service import get_place_detail2

nearby_bp = Blueprint('nearby', __name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("環境変数 GOOGLE_API_KEY を設定してください")

NEARBY_SEARCH_API = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
PHOTO_API = "https://maps.googleapis.com/maps/api/place/photo"

def is_currently_open(opening_hours_periods):
    """
    現在時刻が営業時間内かどうかを判定する関数
    """
    if not opening_hours_periods:
        return None
    
    jst = pytz.timezone('Asia/Tokyo')
    now = datetime.now(jst)
    current_day = now.weekday()
    google_day = (current_day + 1) % 7
    current_time = now.hour * 100 + now.minute
    
    for period in opening_hours_periods:
        open_info = period.get('open', {})
        close_info = period.get('close', {})
        
        open_day = open_info.get('day')
        open_time = int(open_info.get('time', '0000'))
        
        if not close_info:
            if open_day == google_day:
                return True
            continue
            
        close_day = close_info.get('day')
        close_time = int(close_info.get('time', '0000'))
        
        if open_day == close_day == google_day:
            if open_time <= current_time <= close_time:
                return True
        
        elif open_day == google_day and close_day == (google_day + 1) % 7:
            if current_time >= open_time:
                return True
        elif close_day == google_day and open_day == (google_day - 1) % 7:
            if current_time <= close_time:
                return True
    
    return False

@nearby_bp.route('/', methods=['GET'])
def get_nearby_open_shops():
    """
    近くの開いている店舗を取得するエンドポイント
    """
    # ★ フロントエンドから言語設定を取得
    lang = request.args.get('lang', 'ja')
    
    food_type = request.args.get('food_type')
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    radius = request.args.get('radius', '1000')
    
    if not all([food_type, lat, lng]):
        return jsonify({"error": "food_type, lat, lng are required"}), 400
    
    try:
        lat = float(lat)
        lng = float(lng)
        radius = int(radius)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid lat/lng/radius parameters"}), 400
    
    search_query = food_type
    
    try:
        nearby_response = requests.get(NEARBY_SEARCH_API, params={
            "location": f"{lat},{lng}",
            "radius": radius,
            "keyword": search_query,
            "type": "restaurant",
            "language": "ja", # ★ Nearby Searchの検索クエリは日本語で固定
            "key": GOOGLE_API_KEY,
        }, timeout=10)
        nearby_response.raise_for_status()
        
        nearby_data = nearby_response.json()
        places = nearby_data.get("results", [])
        
        open_shops = []
        
        for place in places[:10]:
            place_id = place.get("place_id")
            if not place_id:
                continue

            photo_ref = (place.get("photos", [{}])[0].get("photo_reference")
                             if place.get("photos") else None)
            
            main_photo_url = (f"{PHOTO_API}?maxwidth=400&photoreference={photo_ref}&key={GOOGLE_API_KEY}"
                              if photo_ref and GOOGLE_API_KEY else None)
            
            # ★ get_place_detail2関数に言語パラメータを渡す
            shop_detail = get_place_detail2(place_id, lang=lang)

            if not shop_detail:
                continue
            
            periods = shop_detail.get("opening_hours_periods", [])
            
            is_open = is_currently_open(periods)
            
            if is_open:
                # ★ get_place_detail2から返された多言語データを含める
                shop_data = {
                    "place_id": shop_detail.get("place_id"),
                    "name": shop_detail.get("name"),
                    "name_en": shop_detail.get("name_en"), # ★ 英語名を追加
                    "address": shop_detail.get("address"),
                    "address_en": shop_detail.get("address_en"), # ★ 英語住所を追加
                    "latitude": shop_detail.get("latitude"),
                    "longitude": shop_detail.get("longitude"),
                    "Maps_url": shop_detail.get("url"),
                    "user_ratings_total": shop_detail.get("user_ratings_total"),
                    "rating": shop_detail.get("rating"),
                    "main_photo_url": main_photo_url,
                    "opening_hours_periods": periods
                }
                
                open_shops.append(shop_data)
        
        return jsonify(open_shops), 200
        
    except requests.RequestException as e:
        return jsonify({"error": f"Google Places API request failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500