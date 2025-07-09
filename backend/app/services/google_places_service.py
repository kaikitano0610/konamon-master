# backend/app/services/google_places_service.py

import os
import requests

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("環境変数 GOOGLE_API_KEY を設定してください")

TEXT_SEARCH_API = "https://maps.googleapis.com/maps/api/place/textsearch/json"
DETAILS_API      = "https://maps.googleapis.com/maps/api/place/details/json"
PHOTO_API        = "https://maps.googleapis.com/maps/api/place/photo"


def text_search(query: str, food_type: str = "", limit=5):
    """
    Text Search API でクエリ検索 → 上位 `limit` 件を返す
    query: ユーザーの気分
    food_type: 食べ物の種類
    戻り値: [{'place_id': ..., 'name': ..., 'address': ..., 'photo_ref': ...}, ...]
    """
    search_query = f"{food_type} {query}".strip()

    params = {
        "query": search_query,
        "key": GOOGLE_API_KEY,
    }
    
    resp = requests.get(TEXT_SEARCH_API, params=params, timeout=10)
    resp.raise_for_status()
    
    shops = []
    results = resp.json().get("results", [])[:limit]
    for r in results:
        # 基本情報を取得
        shop_data = {
            "place_id": r.get("place_id"),
            "name":      r.get("name"),
            "address":   r.get("formatted_address"),
            "photo_ref": (r.get("photos", [{}])[0].get("photo_reference")
                          if r.get("photos") else None),
            "phone":      r.get("formatted_phone_number"),
            "opening_hours": r.get("opening_hours", {}).get("weekday_text"),

        }
        
        # 詳細情報を取得（営業時間）
        place_id = r.get("place_id")
        if place_id:
            try:
                detail = get_place_detail(place_id)
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


def get_place_detail(place_id: str, lang="ja"):
    """
    Place Details API で詳細取得
    戻り値: dict（店舗詳細） / None
    """
    resp = requests.get(DETAILS_API, params={
        "place_id": place_id,
        "language": lang,
        "fields": "name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,photos",
        "key": GOOGLE_API_KEY,
    }, timeout=10)
    resp.raise_for_status()

    result = resp.json().get("result")
    if not result:
        return None

    photo_ref = (result.get("photos", [{}])[0].get("photo_reference")
                 if result.get("photos") else None)

    # 電話番号を取得（formatted_phone_numberまたはinternational_phone_number）
    phone = result.get("formatted_phone_number") or result.get("international_phone_number")
    
    # 営業時間を取得
    opening_hours_info = result.get("opening_hours", {})
    opening_hours = opening_hours_info.get("weekday_text")

    return {
        "place_id": place_id,
        "name": result.get("name"),
        "address": result.get("formatted_address"),
        "phone": phone,
        "opening_hours": opening_hours,
        "photo_url": (f"{PHOTO_API}?maxwidth=400&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
                      if photo_ref else None)
    }