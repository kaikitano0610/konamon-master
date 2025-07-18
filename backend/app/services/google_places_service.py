# backend/app/services/google_places_service.py

import os
import requests

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("環境変数 GOOGLE_API_KEY を設定してください")

TEXT_SEARCH_API = "https://maps.googleapis.com/maps/api/place/textsearch/json"
DETAILS_API      = "https://maps.googleapis.com/maps/api/place/details/json"
PHOTO_API        = "https://maps.googleapis.com/maps/api/place/photo"


def get_price_level_text(price_level):
    """
    価格帯レベルを具体的な金額範囲に変換（500円区切り）
    1: ～500円, 2: 500～1000円, 3: 1000～1500円, 4: 1500円～
    """
    if price_level is None:
        return "価格情報なし"
    
    price_texts = {
        1: "～500円",
        2: "500～1000円", 
        3: "1000～1500円",
        4: "1500円～"
    }
    
    return price_texts.get(price_level, "価格情報なし")


def text_search(query: str, food_type: str = "", limit=5):
    """
    Text Search API でクエリ検索 → 上位 `limit` 件を返す
    query: ユーザーの気分
    food_type: 食べ物の種類
    戻り値: [{'place_id': ..., 'name': ..., 'address': ..., 'rating': ..., 'user_ratings_total': ..., 'photo_url': ...}, ...]
    """
    search_query = f"{food_type} {query}".strip()

    params = {
        "query": search_query,
        "key": GOOGLE_API_KEY,
        "language": "ja",
    }
    
    resp = requests.get(TEXT_SEARCH_API, params=params, timeout=10)
    resp.raise_for_status()
    
    shops = []
    results = resp.json().get("results", [])[:limit]
    for r in results:
        # 基本情報を取得
        photo_ref = (r.get("photos", [{}])[0].get("photo_reference")
                     if r.get("photos") else None)
        
        shop_data = {
            "place_id": r.get("place_id"),
            "name":      r.get("name"),
            "address":   r.get("formatted_address"),
            "rating":    r.get("rating"),  # 評価（1.0～5.0）
            "user_ratings_total": r.get("user_ratings_total"),  # 評価数
            "photo_url": (f"{PHOTO_API}?maxwidth=400&photoreference={photo_ref}&key={GOOGLE_API_KEY}"
                          if photo_ref and GOOGLE_API_KEY else None),
        }
        
        # 詳細情報を取得（営業時間のみ）
        place_id = r.get("place_id")
        if place_id:
            try:
                detail = get_place_detail(place_id, lang="ja", photo_ref=photo_ref)
                if detail:
                    shop_data["opening_hours"] = detail.get("opening_hours")
                else:
                    shop_data["opening_hours"] = None
            except Exception as e:
                # 詳細情報の取得に失敗しても基本情報は返す
                shop_data["opening_hours"] = None
        else:
            shop_data["opening_hours"] = None
            
        shops.append(shop_data)
    return shops


def get_place_detail(place_id: str, lang="ja", photo_ref=None):
    """
    Place Details API で詳細取得
    戻り値: dict（店舗詳細） / None
    """
    
    resp = requests.get(DETAILS_API, params={
        "place_id": place_id,
        "language": lang,
        "fields": "name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,photos,rating,user_ratings_total,price_level",
        "key": GOOGLE_API_KEY,
    }, timeout=10)
    resp.raise_for_status()

    result = resp.json().get("result")
    if not result:
        return None

    # text_searchから渡されたphoto_refを優先的に使用
    if not photo_ref:
        photo_ref = (result.get("photos", [{}])[0].get("photo_reference")
                     if result.get("photos") else None)

    # 電話番号を取得（formatted_phone_numberまたはinternational_phone_number）
    phone = result.get("formatted_phone_number") or result.get("international_phone_number")
    # 電話番号がない場合は「情報がありません」を表示
    if not phone:
        phone = "情報がありません"
    
    # 営業時間を取得
    opening_hours_info = result.get("opening_hours", {})
    opening_hours = opening_hours_info.get("weekday_text")

    # 評価情報を取得
    rating = result.get("rating")  # 1.0～5.0の評価
    user_ratings_total = result.get("user_ratings_total")  # 評価数

    # 価格帯を取得
    price_level = result.get("price_level")  # 0～4の価格帯レベル
    price_level_text = get_price_level_text(price_level)  # 日本語表示

    return {
        "place_id": place_id,
        "name": result.get("name"),
        "address": result.get("formatted_address"),
        "phone": phone,
        "opening_hours": opening_hours,
        "rating": rating,
        "user_ratings_total": user_ratings_total,
        "price_level_text": price_level_text,
        "photo_url": (f"{PHOTO_API}?maxwidth=400&photoreference={photo_ref}&key={GOOGLE_API_KEY}"
                      if photo_ref and GOOGLE_API_KEY else None)
    }

def get_place_detail2(place_id: str, lang="ja"):
    resp = requests.get(DETAILS_API, params={
        "place_id": place_id,
        "language": lang,
        "fields": "name,formatted_address,geometry,photos,opening_hours,rating,user_ratings_total,url",
        "key": GOOGLE_API_KEY,
    }, timeout=10)
    resp.raise_for_status()

    result = resp.json().get("result")
    if not result:
        return None

    photo_ref = (result.get("photos", [{}])[0].get("photo_reference")
                 if result.get("photos") else None)

    geometry = result.get("geometry", {}).get("location", {})

    return {
        "place_id": place_id,
        "name": result.get("name"),
        "address": result.get("formatted_address"),
        "latitude": geometry.get("lat"),
        "longitude": geometry.get("lng"),
        "main_photo_url": (
            f"{PHOTO_API}?maxwidth=400&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
            if photo_ref else None
        ),
        "opening_hours_periods": result.get("opening_hours", {}).get("periods", [])
    }

