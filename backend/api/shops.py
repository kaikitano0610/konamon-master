# konamon-master/backend/api/shops.py
from flask import Blueprint, request, jsonify
from ..services.db_service import get_db_connection 

shops_bp = Blueprint('shops', __name__)

@shops_bp.route('/', methods=['GET'])
def get_all_shops():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # shopsテーブルからデータを取得
            sql = "SELECT id, name, address, category FROM shops;"
            cursor.execute(sql)
            shops = cursor.fetchall()
            return jsonify(shops), 200
    except Exception as e:
        print(f"店舗取得エラー: {e}")
        return jsonify({"error": "Failed to retrieve shops", "details": str(e)}), 500
    finally:
        if connection:
            connection.close()

@shops_bp.route('/<int:shop_id>', methods=['GET'])
def get_shop_by_id(shop_id):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "SELECT id, name, address, description, category FROM shops WHERE id = %s;"
            cursor.execute(sql, (shop_id,))
            shop = cursor.fetchone()
            if shop:
                return jsonify(shop), 200
            return jsonify({"message": "Shop not found"}), 404
    except Exception as e:
        print(f"単一店舗取得エラー: {e}")
        return jsonify({"error": "Failed to retrieve shop", "details": str(e)}), 500
    finally:
        if connection:
            connection.close()

# 他にも店舗追加、更新、削除などのAPIを追加可能