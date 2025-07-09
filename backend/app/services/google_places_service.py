# backend/app/services/google_places_service.py

import os
import requests

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("環境変数 GOOGLE_API_KEY を設定してください")

TEXT_SEARCH_API = "https://maps.googleapis.com/maps/api/place/textsearch/json"
DETAILS_API      = "https://maps.googleapis.com/maps/api/place/details/json"
PHOTO_API        = "https://maps.googleapis.com/maps/api/place/photo"


def text_search(query: str, lang="ja", limit=3):
    """
    Text Search API でクエリ検索 → 上位 `limit` 件を返す
    戻り値: [{'place_id': ..., 'name': ..., 'address': ..., 'photo_ref': ...}, ...]
    """
    resp = requests.get(TEXT_SEARCH_API, params={
        "query": query,
        "language": lang,
        "key": GOOGLE_API_KEY,
    }, timeout=10)
    resp.raise_for_status()

    results = resp.json().get("results", [])[:limit]
    shops = []
    for r in results:
        shops.append({
            "place_id": r.get("place_id"),
            "name":      r.get("name"),
            "address":   r.get("formatted_address"),
            "photo_ref": (r.get("photos", [{}])[0].get("photo_reference")
                          if r.get("photos") else None),
        })
    return shops


def get_place_detail(place_id: str, lang="ja"):
    """
    Place Details API で詳細取得
    戻り値: dict（店舗詳細） / None
    """
    resp = requests.get(DETAILS_API, params={
        "place_id": place_id,
        "language": lang,
        "fields": "name,formatted_address,formatted_phone_number,opening_hours,photos",
        "key": GOOGLE_API_KEY,
    }, timeout=10)
    resp.raise_for_status()

    result = resp.json().get("result")
    if not result:
        return None

    photo_ref = (result.get("photos", [{}])[0].get("photo_reference")
                 if result.get("photos") else None)

    return {
        "place_id": place_id,
        "name":  result.get("name"),
        "address": result.get("formatted_address"),
        "phone":   result.get("formatted_phone_number"),
        "opening_hours": result.get("opening_hours", {}).get("weekday_text"),
        "photo_url": (f"{PHOTO_API}?maxwidth=400&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
                      if photo_ref else None)
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
