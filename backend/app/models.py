# backend/models.py
from backend.app.extensions import db  # db は app.py で作成されたものをインポート
from datetime import datetime
from enum import Enum
from werkzeug.security import generate_password_hash, check_password_hash
# ---------- 共通 mixin ---------- #
class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )


# ユーザーモデル
class User(TimestampMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(255), unique=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # リレーション
    recipes = db.relationship("Recipe", back_populates="user", cascade="all, delete")
    reviews = db.relationship("Review", back_populates="user", cascade="all, delete")
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

# ---------- shops ---------- #
class Shop(TimestampMixin, db.Model):
    __tablename__ = "shops"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255))
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    latitude = db.Column(db.Numeric(9, 6))
    longitude = db.Column(db.Numeric(9, 6))
    opening_hours = db.Column(db.String(255))
    phone_number = db.Column(db.String(20))
    website_url = db.Column(db.String(255))
    sns_link = db.Column(db.String(255))
    mood_tags = db.Column(db.String(255))
    average_rating = db.Column(db.Numeric(2, 1), default=0.0, nullable=False)
    total_reviews = db.Column(db.Integer, default=0, nullable=False)
    main_photo_url = db.Column(db.String(255))

    # リレーション
    reviews = db.relationship("Review", back_populates="shop", cascade="all, delete")
    realtime_status = db.relationship(
        "ShopRealtimeStatus", uselist=False, back_populates="shop", cascade="all, delete"
    )
    congestion_predictions = db.relationship(
        "ShopPredictedCongestion", back_populates="shop", cascade="all, delete"
    )


# ---------- reviews ---------- #
class Review(TimestampMixin, db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    shop_id = db.Column(
        db.Integer,
        db.ForeignKey("shops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating = db.Column(db.Numeric(2, 1), nullable=False)
    comment = db.Column(db.Text)
    photo_url = db.Column(db.String(255))

    # リレーション
    shop = db.relationship("Shop", back_populates="reviews")
    user = db.relationship("User", back_populates="reviews")


# ---------- recipes ---------- #
class Recipe(TimestampMixin, db.Model):
    __tablename__ = "recipes"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = db.Column(db.String(255), nullable=False)
    ingredients = db.Column(db.Text, nullable=False)
    instructions = db.Column(db.Text, nullable=False)
    photo_url = db.Column(db.String(255))
    video_url = db.Column(db.String(255))
    difficulty = db.Column(db.String(50))
    prep_time_minutes = db.Column(db.Integer)
    cook_time_minutes = db.Column(db.Integer)

    user = db.relationship("User", back_populates="recipes")


# ---------- shop_realtime_status ---------- #
class _CongestionStatus(Enum):
    FREE = "空いてるで！"
    MEDIUM = "ちょい込みやな〜"
    BUSY = "今行くと待つかも！"


class ShopRealtimeStatus(db.Model):
    __tablename__ = "shop_realtime_status"

    shop_id = db.Column(
        db.Integer,
        db.ForeignKey("shops.id", ondelete="CASCADE"),
        primary_key=True,
    )
    current_status = db.Column(
        db.Enum(_CongestionStatus, native_enum=False, length=20), nullable=False
    )
    estimated_wait_minutes = db.Column(db.Integer)
    last_updated = db.Column(
        db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )

    shop = db.relationship("Shop", back_populates="realtime_status")


# ---------- shop_predicted_congestion ---------- #
class ShopPredictedCongestion(db.Model):
    __tablename__ = "shop_predicted_congestion"
    __table_args__ = (
        db.PrimaryKeyConstraint("shop_id", "target_datetime"),
    )

    shop_id = db.Column(
        db.Integer,
        db.ForeignKey("shops.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_datetime = db.Column(db.DateTime, nullable=False)
    predicted_status = db.Column(
        db.Enum(_CongestionStatus, native_enum=False, length=20), nullable=False
    )
    predicted_wait_minutes = db.Column(db.Integer)

    shop = db.relationship("Shop", back_populates="congestion_predictions")