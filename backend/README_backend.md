## 🔨 マイグレーション手順（Flask-Migrate）

Flask + SQLAlchemy モデルの変更をデータベースに反映させるための手順です。

---

マイグレーション環境の初期化（初回のみ）
```bash
docker compose exec backend flask db init
```

マイグレーションファイル作成（モデル変更時）
```bash
docker compose exec backend flask db migrate  --directory backend/migrations -m "ユーザーテーブル作成"
```

データベースに反映（マイグレーション適用）
```bash
docker compose exec backend flask db upgrade --directory backend/migrations
```