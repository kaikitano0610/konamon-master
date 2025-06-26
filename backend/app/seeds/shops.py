# backend/app/seeds/shops.py
import click
from flask.cli import with_appcontext

from backend.app import create_app, db
from backend.app.models import Shop, ShopRealtimeStatus, _CongestionStatus # ここを修正！

@click.command(name='shops')
@with_appcontext
def seed_shops():
    app = create_app()
    with app.app_context():
        # 既存のデータを削除する際に、依存関係のある子テーブルから削除する必要があります
        # ORMのdelete()ではリレーションのcascadeが動作しない場合があるので、直接削除
        db.session.query(ShopRealtimeStatus).delete()
        db.session.query(Shop).delete()

        # サンプルデータに congestion_status を直接持たせるのではなく、
        # ShopRealtimeStatus を作成して Shop に関連付けます
        shops_data = [
            {"name": "お好み焼き 花子", "description": "地元で有名な人気店", "congestion_status_enum": _CongestionStatus.MEDIUM, "wait_minutes": 5},
            {"name": "たこ焼き 太郎", "description": "外はカリッ、中はトロッ", "congestion_status_enum": _CongestionStatus.FREE, "wait_minutes": 0},
            {"name": "焼きそば 次郎", "description": "ボリューム満点の定食屋", "congestion_status_enum": _CongestionStatus.BUSY, "wait_minutes": 30},
            {"name": "焼きそば 大好きマン", "description": "たまにはたくさん食べたくなります", "congestion_status_enum": _CongestionStatus.BUSY, "wait_minutes": 20},
        ]

        shops_to_add = []
        for data in shops_data:
            shop = Shop(
                name=data["name"],
                description=data["description"],
                # congestion_status は直接渡さない
            )
            # ShopRealtimeStatus インスタンスを作成し、Shop に関連付ける
            shop_status = ShopRealtimeStatus(
                current_status=data["congestion_status_enum"],
                estimated_wait_minutes=data["wait_minutes"],
                # shop_id は commit 時またはflush時に自動で設定される
            )
            shop.realtime_status = shop_status # Shop に ShopRealtimeStatus を関連付ける
            shops_to_add.append(shop) # Shop インスタンスをリストに追加

        db.session.add_all(shops_to_add)
        db.session.commit()
        print("✅ 初期データを投入しました。")