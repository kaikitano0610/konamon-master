from backend.app import create_app 
from backend.app.seeds import seed # seedコマンドグループをインポート

app = create_app()

# flask cliにseedコマンドグループを登録
app.cli.add_command(seed)