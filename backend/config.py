# konamon-master/backend/config.py

class Config:
    """基本設定クラス"""
    DEBUG = False
    TESTING = False
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