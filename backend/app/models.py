# backend/models.py
from backend.app import db  # db は app.py で作成されたものをインポート

class Shop(db.Model):
    __tablename__ = 'shops'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    recommended_reason = db.Column(db.Text, nullable=False)
    congestion_status = db.Column(db.String(50), nullable=False)
