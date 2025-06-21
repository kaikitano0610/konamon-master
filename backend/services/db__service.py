# konamon-master/backend/services/db_service.py
import pymysql.cursors
import os

# 環境変数は app.py が起動時に読み込み、os.environ に設定されるため、
# ここでは直接 os.environ から取得します。
DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_NAME')
DB_PORT = int(os.environ.get('DB_PORT', 3306))

def get_db_connection():
    """データベース接続を確立する関数"""
    if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
        raise ValueError("Database connection environment variables are not set.")

    try:
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT,
            cursorclass=pymysql.cursors.DictCursor
        )
        print("Successfully connected to database!") # 接続確認用
        return connection
    except pymysql.Error as e:
        print(f"データベース接続エラー: {e}")
        raise # 接続失敗を呼び出し元に通知