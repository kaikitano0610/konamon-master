# backend/seed/shops.py

from app import create_app, db
from backend.app.models import Shop


def seed_shops():
    app = create_app()
    with app.app_context():
        db.session.query(Shop).delete()

        shops = [
            Shop(name="お好み焼き 花子", recommended_reason="地元で有名な人気店", congestion_status="やや混雑"),
            Shop(name="たこ焼き 太郎", recommended_reason="外はカリッ、中はトロッ", congestion_status="空いている"),
            Shop(name="焼きそば 次郎", recommended_reason="ボリューム満点の定食屋", congestion_status="非常に混雑"),
        ]

        db.session.add_all(shops)
        db.session.commit()
        print("✅ 初期データを投入しました。")

if __name__ == "__main__":
    seed_shops()
