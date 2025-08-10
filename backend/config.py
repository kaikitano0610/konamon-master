import os # <-- osモジュールをインポート

class Config:
    """基本設定クラス"""
    DEBUG = False
    TESTING = False
    
    # データベースの接続情報を環境変数から取得して設定
    # os.environ.get()で環境変数が存在しない場合に備えてデフォルト値をNoneに設定
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.environ.get('MYSQL_USER')}:{os.environ.get('MYSQL_ROOT_PASSWORD')}"
        f"@{os.environ.get('MYSQL_HOST')}:{os.environ.get('MYSQL_PORT')}/{os.environ.get('MYSQL_DB')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # ここに環境変数ではない、アプリケーション固有の設定を記述
    # 例: アップロードファイルの最大サイズなど

class DevelopmentConfig(Config):
    """開発環境設定"""
    DEBUG = True
    # 開発用の特別な設定があればここに記述

class ProductionConfig(Config):
    """本番環境設定"""
    # 本番用の特別な設定があればここに記述
    pass

# 環境変数 'FLASK_ENV' に応じて設定クラスを選択
# app.py で app.config.from_object(os.environ.get('FLASK_ENV', 'config.DevelopmentConfig'))
# のように読み込むことも可能