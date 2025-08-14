# backend/tests/test_api.py
from backend.app import create_app

# テスト用のFlaskアプリケーションインスタンスを作成
def test_app_creation():
    app = create_app()
    assert app is not None

# health_checkエンドポイントが正常なレスポンスを返すかテスト
def test_health_check():
    app = create_app()
    client = app.test_client()
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json == {"status": "ok", "message": "Backend is running!"}