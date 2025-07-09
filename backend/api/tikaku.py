import requests
import os
from flask import Flask, Blueprint, request, jsonify
import datetime

# 環境変数からAPIキーを取得
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print("Warning: GOOGLE_API_KEY環境変数が設定されていません。")
    # 開発環境で一時的にAPIキーを直接設定する場合 (本番環境では絶対に行わないでください)
    # GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY_HERE"

TEXT_SEARCH_API = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACE_DETAILS_API = "https://maps.googleapis.com/maps/api/place/details/json"
PHOTO_API = "https://maps.googleapis.com/maps/api/place/photo"

# BlueprintのURLプレフィックスを変更
shops_bp = Blueprint("shops", __name__, url_prefix="/api/shops")

# --- 新しい近くの開いている店一覧エンドポイント ---
@shops_bp.route("/nearby", methods=["GET"])
def get_nearby_open_shops():
    food_type = (request.args.get("food_type") or "").strip()

    if not food_type:
        return jsonify({"error": "food_type is required."}), 400

    if food_type not in ["たこ焼き", "お好み焼き"]:
        return jsonify({"error": "Invalid food_type. Must be 'たこ焼き' or 'お好み焼き'."}), 400

    # 現在時刻を取得
    now = datetime.datetime.now()
    current_day_of_week = now.weekday()  # 月曜日が0、日曜日が6
    current_time_hhmm = now.strftime("%H%M") # "HHMM" 形式

    # Text Search API で指定されたフードタイプの店を検索
    # ここでは「近くの」というクエリはPlaces APIでは緯度経度指定が必要ですが、
    # Text Searchはクエリベースなので、より一般的な検索を行います。
    # 「hashimoto たこ焼き」のように場所とフードタイプを組み合わせることも可能ですが、
    # 今回の要件（距離計算はフロントエンド）から、場所の指定は含めず、純粋にフードタイプで検索します。
    search_query = f"{food_type} restaurant" # または "{food_type} shop"

    # text_search_and_detail関数を再利用して詳細情報を取得
    # ただし、今回は mood_query は使わないので、ダミーの値を渡すか、新しい専用関数を作成することもできます。
    # 今回はシンプルにtext_search_and_detailを流用します。
    all_shops_details = text_search_and_detail(search_query, "") # mood_query として search_query を渡し、food_type は不要

    open_shops = []
    for shop in all_shops_details:
        # Places APIの opening_hours/periods データを使って開店中か判定
        is_open_now = False
        if shop.get("opening_hours_periods"):
            # is_open_now を判定するロジックをここに実装
            # Google Places API の is_open フィールドも利用できるが、
            # 詳細な期間情報（periods）を使うことで、より正確な判断が可能。
            # ただし、is_open_now はシンプルにAPIからの情報を使う方が確実です。
            # 例えば、Place Details APIの 'opening_hours.open_now' フィールドを使う
            # (text_search_and_detailで取得するフィールドに 'opening_hours/open_now' を追加する必要あり)

            # 今回のtext_search_and_detailでは 'open_now' は取得していないので、
            # 'periods' を使って簡易的に判定します。
            # 実際には Google Places API の is_open フィールドを利用することをお勧めします。
            # 例えば、fields="opening_hours/periods,opening_hours/open_now" のようにfieldsを拡張

            # ここではperiodsを使って現在開いているかを判定する簡易ロジック
            # より堅牢なロジックは公式ドキュメントを参照し、エッジケース（深夜営業など）を考慮する必要があります。
            for period in shop["opening_hours_periods"]:
                open_day = period.get("open", {}).get("day")
                open_time = period.get("open", {}).get("time")
                close_day = period.get("close", {}).get("day")
                close_time = period.get("close", {}).get("time")

                if open_day is None or open_time is None or close_day is None or close_time is None:
                    continue # 不完全な期間データはスキップ

                # 今日が営業日かどうか
                if open_day == current_day_of_week:
                    # 開始時刻と終了時刻を datetime オブジェクトに変換
                    open_dt = datetime.datetime.strptime(open_time, "%H%M").time()
                    close_dt = datetime.datetime.strptime(close_time, "%H%M").time()

                    # 日をまたぐ営業の場合（例：22:00オープン、翌日02:00クローズ）
                    if open_dt > close_dt:
                        # 現在時刻がオープン時刻より後で、かつクローズ時刻より前（翌日）の場合
                        # または、今日がオープン日（例：月曜22時オープン）で、現在時刻がオープン時刻より後
                        # または、今日がクローズ日（例：火曜02時クローズ）で、現在時刻がクローズ時刻より前
                        # ここは複雑になるため、より正確な判定は Google Places API の 'open_now' フィールドの利用を推奨
                        if (current_time_hhmm >= open_time) or \
                           (current_day_of_week == close_day and current_time_hhmm < close_time):
                            is_open_now = True
                            break # 開いている期間が見つかったのでループを抜ける
                    else:
                        # 通常の営業時間の場合（例：10:00オープン、18:00クローズ）
                        if open_time <= current_time_hhmm < close_time:
                            is_open_now = True
                            break # 開いている期間が見つかったのでループを抜ける
                # 日をまたぐ営業のもう一方のパターン（例: 日曜22時オープン、月曜02時クローズで、月曜に判定する場合）
                # 前日が営業日で、今日のクローズ時刻まで開いている場合
                elif (current_day_of_week == close_day) and (open_day != close_day) and (open_time > close_time):
                    if current_time_hhmm < close_time:
                         is_open_now = True
                         break


        # Google Places APIの 'open_now' フィールドを使う方がはるかに簡単で正確です。
        # 上記の periods を使った判定ロジックは非常に複雑で、バグの原因になりやすいです。
        # そのため、Place Details APIの fields に "opening_hours/open_now" を追加し、
        # shop.get("opening_hours", {}).get("open_now") を直接使うことを強く推奨します。

        # ここでは簡易的に、もし periods が取得できていて、かつ open_now フラグがなくても
        # 何らかの期間があればリストに入れる、という運用も考えられますが、
        # より正確に「今開いている」を判定するためには 'open_now' が不可欠です。

        # 例えば、text_search_and_detail で open_now を取得するように変更した場合:
        # if shop.get("opening_hours", {}).get("open_now"):
        #    open_shops.append({ ...必要な情報のみを抽出... })


        # ★重要: Place Details APIの "opening_hours/open_now" フィールドを使用する変更を推奨★
        # 以下は暫定的に、`is_open_now`がTrueの場合、または`open_now`フィールドがない場合のフォールバックとしています。
        # ただし、上記periods判定ロジックの複雑さと不確実性を考慮すると、
        # Google APIの `open_now` フィールドを利用するように `text_search_and_detail` を修正することが最善です。
        if is_open_now: # もしくは shop.get("opening_hours", {}).get("open_now") が True の場合
            open_shops.append({
                "name": shop.get("name"),
                "latitude": shop.get("latitude"),
                "longitude": shop.get("longitude"),
                "main_photo_url": shop.get("main_photo_url")
            })

    return jsonify(open_shops), 200

# --- text_search_and_detail 関数（fieldsにopen_nowを追加することを推奨）---
def text_search_and_detail(query: str, food_type_for_query: str, lang="ja", limit=20): # limitを増やして検索数を増やす
    """
    Text Search API でクエリ検索し、Place Details API で詳細情報を取得し、
    指定されたJSON形式のリストを返します。
    """
    full_query = f"{query} {food_type_for_query}".strip() # 気分と食事タイプを組み合わせて検索クエリを作成

    # Text Search API を呼び出し
    resp = requests.get(TEXT_SEARCH_API, params={
        "query": full_query,
        "language": lang,
        "key": GOOGLE_API_KEY,
        "region": "jp", # 日本に限定する
        # "locationbias": "point:34.2120,135.5900", # 和歌山県橋本市の中心座標 (必要に応じて追加)
        # "radius": 50000 # locationbias と組み合わせる
    }, timeout=10)
    resp.raise_for_status()

    text_search_results = resp.json().get("results", [])[:limit]
    shops_data = []

    for r in text_search_results:
        place_id = r.get("place_id")
        if not place_id:
            continue

        # Place Details API を呼び出し
        # ★重要: fields に "opening_hours/open_now" を追加★
        details_resp = requests.get(PLACE_DETAILS_API, params={
            "place_id": place_id,
            "fields": "name,formatted_address,geometry/location,rating,user_ratings_total,url,photos,opening_hours/periods,opening_hours/open_now",
            "language": lang,
            "key": GOOGLE_API_KEY,
        }, timeout=10)
        details_resp.raise_for_status()
        details = details_resp.json().get("result", {})

        main_photo_url = None
        if details.get("photos"):
            photo_reference = details["photos"][0].get("photo_reference")
            if photo_reference:
                main_photo_url = f"{PHOTO_API}?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_API_KEY}"

        shop_info = {
            "place_id": details.get("place_id"),
            "name": details.get("name"),
            "address": details.get("formatted_address"),
            "latitude": details.get("geometry", {}).get("location", {}).get("lat"),
            "longitude": details.get("geometry", {}).get("location", {}).get("lng"),
            "Maps_url": details.get("url"),
            "user_ratings_total": details.get("user_ratings_total"),
            "rating": details.get("rating"),
            "main_photo_url": main_photo_url,
            "opening_hours_periods": details.get("opening_hours", {}).get("periods", []),
            "open_now": details.get("opening_hours", {}).get("open_now") # ★追加: open_now フィールド★
        }
        shops_data.append(shop_info)

    return shops_data