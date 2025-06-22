# backend/seed/shops.py
import click
from flask.cli import with_appcontext

from backend.app import create_app, db
from backend.app.models import Shop

@click.command(name='shops') # このコマンドを 'shops' という名前で定義します
@with_appcontext # これを付けることで、Flaskのアプリコンテキスト内で実行されるようになります
def seed_shops():
    app = create_app()
    with app.app_context():
        db.session.query(Shop).delete()

        shops = [
            Shop(name="お好み焼き 花子", recommended_reason="地元で有名な人気店", congestion_status="やや混雑"),
            Shop(name="たこ焼き 太郎", recommended_reason="外はカリッ、中はトロッ", congestion_status="空いている"),
            Shop(name="焼きそば 次郎", recommended_reason="ボリューム満点の定食屋", congestion_status="非常に混雑"),
            Shop(name="焼きそば 大好きマン", recommended_reason="たまにはたくさん食べたくなります", congestion_status="非常に混雑"),
        ]

        db.session.add_all(shops)
        db.session.commit()
        print("✅ 初期データを投入しました。")