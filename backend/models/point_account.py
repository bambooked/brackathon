"""PointAccount model for Tortoise-ORM."""

from tortoise import fields
from tortoise.models import Model


class PointAccount(Model):
    """
    ポイント残高テーブル
    各ユーザーの現在のポイント残高を保存
    """

    id = fields.IntField(pk=True)
    user = fields.OneToOneField(
        "models.User", related_name="point_account", on_delete=fields.CASCADE
    )
    balance = fields.IntField(default=0)  # 現在のポイント残高
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "point_accounts"

    def __str__(self):
        return f"User {self.user_id}: {self.balance} points"
