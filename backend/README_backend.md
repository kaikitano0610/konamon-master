## モデル -> マイグレーション
docker compose exec backend bash
flask db migrate  --directory backend/migrations -m "hoge"
flask db upgrade  --directory backend/migrations
