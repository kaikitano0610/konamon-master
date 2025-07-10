import os
import requests
from flask import Flask, Blueprint, request, jsonify
from backend.app.service.google_places_service import get_place_detail2

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
DETAILS_API = "https://maps.googleapis.com/maps/api/place/details/json"
PHOTO_API = "https://maps.googleapis.com/maps/api/place/photo"

def get_current_location_by_place_id():
    """
    クライアントから送られた place_id を使って、Google API 経由で現在地の詳細を取得。
    """
    data = request.get_json()
    place_id = data.get("place_id")

    if not place_id:
        return jsonify({"error": "Missing place_id"}), 400

    place_detail = get_place_detail2(place_id)
    if not place_detail:
        return jsonify({"error": "Failed to fetch place details"}), 500

    return jsonify(place_detail), 200