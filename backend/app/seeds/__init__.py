import click

# shops.py から seed_shops コマンド（関数）をインポート
from .shops import seed_shops

# `flask seed` という親コマンドグループを作成
@click.group()
def seed():
    """Database seeding commands."""
    pass

# 親コマンドに `shops` コマンドを追加
seed.add_command(seed_shops)

# 他にseederファイル（例: users_seeder.py）を作ったら、ここに追加していきます