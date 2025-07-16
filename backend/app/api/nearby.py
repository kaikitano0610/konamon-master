# backend/app/api/nearby.py

from flask import Blueprint, request, jsonify
import os
import requests
from datetime import datetime
import pytz

nearby_bp = Blueprint('nearby', __name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("環境変数 GOOGLE_API_KEY を設定してください")

NEARBY_SEARCH_API = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
DETAILS_API = "https://maps.googleapis.com/maps/api/place/details/json"
PHOTO_API = "https://maps.googleapis.com/maps/api/place/photo"

def is_currently_open(opening_hours_periods):
    """
    現在時刻が営業時間内かどうかを判定する関数
    """
    if not opening_hours_periods:
        return None  # 営業時間情報がない場合
    
    # 日本時間で現在時刻を取得
    jst = pytz.timezone('Asia/Tokyo')
    now = datetime.now(jst)
    current_day = now.weekday()  # 0=月曜, 6=日曜
    # Google Places APIでは 0=日曜, 1=月曜なので変換
    google_day = (current_day + 1) % 7
    current_time = now.hour * 100 + now.minute  # HHMM形式
    
    for period in opening_hours_periods:
        open_info = period.get('open', {})
        close_info = period.get('close', {})
        
        open_day = open_info.get('day')
        open_time = int(open_info.get('time', '0000'))
        
        # 24時間営業の場合（closeがない）
        if not close_info:
            if open_day == google_day:
                return True
            continue
            
        close_day = close_info.get('day')
        close_time = int(close_info.get('time', '0000'))
        
        # 同日内の営業時間
        if open_day == close_day == google_day:
            if open_time <= current_time <= close_time:
                return True
        
        # 日をまたぐ営業時間（例：金曜22:00〜土曜02:00）
        elif open_day == google_day and close_day == (google_day + 1) % 7:
            if current_time >= open_time:
                return True
        elif close_day == google_day and open_day == (google_day - 1) % 7:
            if current_time <= close_time:
                return True
    
    return False

@nearby_bp.route('/nearby', methods=['GET'])
def get_nearby_open_shops():
    """
    近くの開いている店舗を取得するエンドポイント
    """
    # パラメータ取得
    food_type = request.args.get('food_type')
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    radius = request.args.get('radius', '1000')  # デフォルト1000m
    
    # 必須パラメータのチェック
    if not all([food_type, lat, lng]):
        return jsonify({"error": "food_type, lat, lng are required"}), 400
    
    # 座標の数値変換
    try:
        lat = float(lat)
        lng = float(lng)
        radius = int(radius)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid lat/lng/radius parameters"}), 400
    
    # food_typeをGoogle Places APIの検索クエリに変換
    search_query = food_type
    if food_type == "たこ焼き":
        search_query = "たこ焼き"
    elif food_type == "お好み焼き":
        search_query = "お好み焼き"
    
    try:
        # 1. Nearby Search APIで周辺の店舗を検索
        nearby_response = requests.get(NEARBY_SEARCH_API, params={
            "location": f"{lat},{lng}",
            "radius": radius,
            "keyword": search_query,
            "type": "restaurant",
            "language": "ja",
            "key": GOOGLE_API_KEY,
        }, timeout=10)
        nearby_response.raise_for_status()
        
        nearby_data = nearby_response.json()
        places = nearby_data.get("results", [])
        
        open_shops = []
        
        # 2. 各店舗の詳細情報を取得して営業時間をチェック
        for place in places[:10]:  # 最大10件まで処理
            place_id = place.get("place_id")
            if not place_id:
                continue
                
            # Place Details APIで詳細情報を取得
            details_response = requests.get(DETAILS_API, params={
                "place_id": place_id,
                "fields": "name,formatted_address,geometry,photos,opening_hours,rating,user_ratings_total,url",
                "language": "ja",
                "key": GOOGLE_API_KEY,
            }, timeout=10)
            details_response.raise_for_status()
            
            details_data = details_response.json()
            result = details_data.get("result", {})
            
            # 営業時間の取得
            opening_hours = result.get("opening_hours", {})
            periods = opening_hours.get("periods", [])
            
            # 現在営業中かチェック
            is_open = is_currently_open(periods)
            
            # 営業中の店舗のみを結果に含める
            if is_open:
                geometry = result.get("geometry", {}).get("location", {})
                photos = result.get("photos", [])
                photo_ref = photos[0].get("photo_reference") if photos else None
                
                shop_data = {
                    "place_id": place_id,
                    "name": result.get("name"),
                    "address": result.get("formatted_address"),
                    "latitude": geometry.get("lat"),
                    "longitude": geometry.get("lng"),
                    "Maps_url": result.get("url"),
                    "user_ratings_total": result.get("user_ratings_total"),
                    "rating": result.get("rating"),
                    "main_photo_url": (
                        f"{PHOTO_API}?maxwidth=400&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
                        if photo_ref else None
                    ),
                    "opening_hours_periods": periods
                }
                
                open_shops.append(shop_data)
        
        return jsonify(open_shops), 200
        
    except requests.RequestException as e:
        return jsonify({"error": f"Google Places API request failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500