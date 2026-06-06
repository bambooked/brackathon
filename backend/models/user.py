"""User model for Tortoise-ORM."""

from tortoise import fields
from tortoise.models import Model


class User(Model):
    """
    ユーザーテーブル
    Google認証で取得した情報を保存
    """

    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=255, unique=True, index=True)
    name = fields.CharField(max_length=255)
    nickname = fields.CharField(max_length=255, null=True)
    use_nickname = fields.BooleanField(default=False)
    role = fields.CharField(
        max_length=50, default="member"
    )  # member / admin
    team_name = fields.CharField(max_length=255, default="チームA", index=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    # リレーション（逆参照）
    daily_reports: fields.ReverseRelation["DailyReport"]
    reactions: fields.ReverseRelation["Reaction"]
    point_account: fields.ReverseRelation["PointAccount"]
    point_transactions: fields.ReverseRelation["PointTransaction"]

    class Meta:
        table = "users"

    def __str__(self):
        return f"{self.name} ({self.email})"
