"""PointTransaction model for Tortoise-ORM."""

from tortoise import fields
from tortoise.models import Model


class PointTransaction(Model):
    """
    ポイント取引履歴テーブル
    ポイントの増減履歴を保存
    """

    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField(
        "models.User", related_name="point_transactions", on_delete=fields.CASCADE
    )
    amount = fields.IntField()  # 正負の値（正: 獲得、負: 消費）
    transaction_type = fields.CharField(
        max_length=50
    )  # reaction_received / reaction_given / point_exchange / manual_adjustment など
    source_type = fields.CharField(
        max_length=50, null=True
    )  # reaction / present / event_trigger / ai_evaluation など
    source_id = fields.IntField(null=True)  # 関連するリソースのID
    description = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "point_transactions"
        ordering = ["-created_at"]

    def __str__(self):
        sign = "+" if self.amount >= 0 else ""
        return f"{sign}{self.amount} points - {self.transaction_type}"
