# backend/app/services/google_places_service.py

import os
import requests
from backend.app.services.translation_service import translate_text # ★ 翻訳サービスをインポート

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("環境変数 GOOGLE_API_KEY を設定してください")

TEXT_SEARCH_API = "https://maps.googleapis.com/maps/api/place/textsearch/json"
DETAILS_API     = "https://maps.googleapis.com/maps/api/place/details/json"
PHOTO_API       = "https://maps.googleapis.com/maps/api/place/photo"


# ★ 価格帯テキストも多言語対応させる
def get_price_level_text(price_level, lang="ja"):
    """
    価格帯レベルを具体的な金額範囲に変換
    """
    if price_level is None:
        return "価格情報なし" if lang == "ja" else "No price information"
    
    price_texts = {
        "ja": {
            1: "～500円",
            2: "500～1000円", 
            3: "1000～1500円",
            4: "1500円～"
        },
        "en": {
            1: "~500 JPY",
            2: "500~1000 JPY",
            3: "1000~1500 JPY",
            4: "1500+ JPY"
        }
    }
    
    return price_texts.get(lang, {}).get(price_level, "価格情報なし" if lang == "ja" else "No price information")


# ★ langパラメータを追加
def text_search(query: str, food_type: str = "", limit=5, lang="ja"):
    """
    Text Search API でクエリ検索 → 上位 `limit` 件を返す
    query: ユーザーの気分
    food_type: 食べ物の種類
    lang: 翻訳先の言語
    戻り値: [{'place_id': ..., 'name': ..., 'name_en': ..., 'address': ..., 'address_en': ...}]
    """
    search_query = f"大阪の{food_type}屋 {query}".strip()

    params = {
        "query": search_query,
        "key": GOOGLE_API_KEY,
        "language": "ja", # ★ 検索クエリは日本語で固定
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
            "rating":    r.get("rating"),
            "user_ratings_total": r.get("user_ratings_total"),
            "photo_url": (f"{PHOTO_API}?maxwidth=400&photoreference={photo_ref}&key={GOOGLE_API_KEY}"
                          if photo_ref and GOOGLE_API_KEY else None),
        }
        
        # ★ 取得した日本語のnameとaddressを翻訳する
        shop_data["name_en"] = translate_text(shop_data["name"], "en")
        shop_data["address_en"] = translate_text(shop_data["address"], "en")

        # 詳細情報を取得（営業時間とGoogleマップURLも取得）
        place_id = r.get("place_id")
        if place_id:
            try:
                # ★ get_place_detailを呼び出す際に、言語パラメータを渡す
                detail = get_place_detail(place_id, lang=lang, photo_ref=photo_ref)
                if detail:
                    shop_data["opening_hours"] = detail.get("opening_hours")
                    shop_data["Maps_url"] = detail.get("url")
                else:
                    shop_data["opening_hours"] = None
                    shop_data["Maps_url"] = None
            except Exception as e:
                shop_data["opening_hours"] = None
                shop_data["Maps_url"] = None
        else:
            shop_data["opening_hours"] = None
            shop_data["Maps_url"] = None
            
        shops.append(shop_data)
    return shops


# ★ langパラメータを引数に追加
def get_place_detail(place_id: str, lang="ja", photo_ref=None):
    """
    Place Details API で詳細取得
    """
    
    resp = requests.get(DETAILS_API, params={
        "place_id": place_id,
        "language": lang, # ★ 外部APIに言語指定を渡す
        "fields": "name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,photos,rating,user_ratings_total,price_level,url",
        "key": GOOGLE_API_KEY,
    }, timeout=10)
    resp.raise_for_status()

    result = resp.json().get("result")
    if not result:
        return None

    if not photo_ref:
        photo_ref = (result.get("photos", [{}])[0].get("photo_reference")
                     if result.get("photos") else None)

    phone = result.get("formatted_phone_number") or result.get("international_phone_number")
    if not phone:
        phone = "情報がありません" if lang == "ja" else "No information available" # ★ ここも多言語対応

    opening_hours_info = result.get("opening_hours", {})
    # ★ opening_hoursはAPIのlanguageパラメータで翻訳される
    opening_hours = opening_hours_info.get("weekday_text")

    rating = result.get("rating")
    user_ratings_total = result.get("user_ratings_total")

    price_level = result.get("price_level")
    price_level_text = get_price_level_text(price_level, lang=lang) # ★ ヘルパー関数に言語を渡す

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
                      if photo_ref and GOOGLE_API_KEY else None),
        "url": result.get("url"),
        # ★ 翻訳された情報を辞書に追加
        "name_en": translate_text(result.get("name", ""), "en"),
        "address_en": translate_text(result.get("formatted_address", ""), "en"),
        "phone_en": translate_text(phone, "en"),
    }

# ★ langパラメータを引数に追加
def get_place_detail2(place_id: str, lang="ja"):
    """
    Place Details API で詳細取得（Nearbyで主に使用）
    `fields` をNearbyに必要な情報に絞っている
    """
    resp = requests.get(DETAILS_API, params={
        "place_id": place_id,
        "language": lang, # ★ 外部APIに言語指定を渡す
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

    # ★ 翻訳された情報を辞書に追加
    name_ja = result.get("name", "")
    address_ja = result.get("formatted_address", "")
    name_en = translate_text(name_ja, "en")
    address_en = translate_text(address_ja, "en")


    return {
        "place_id": place_id,
        "name": name_ja,
        "address": address_ja,
        "latitude": geometry.get("lat"),
        "longitude": geometry.get("lng"),
        "main_photo_url": (
            f"{PHOTO_API}?maxwidth=400&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
            if photo_ref else None
        ),
        "opening_hours_periods": result.get("opening_hours", {}).get("periods", []),
        "rating": result.get("rating"),
        "user_ratings_total": result.get("user_ratings_total"),
        "url": result.get("url"),
        # ★ ここに翻訳結果を追加する
        "name_en": name_en,
        "address_en": address_en,
    }