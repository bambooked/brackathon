"""Reaction model for Tortoise-ORM."""

from tortoise import fields
from tortoise.models import Model


class Reaction(Model):
    """
    リアクションテーブル
    日報に対するリアクション（like / thanks / checked など）
    """

    id = fields.IntField(pk=True)
    daily_report = fields.ForeignKeyField(
        "models.DailyReport", related_name="reactions", on_delete=fields.CASCADE
    )
    user = fields.ForeignKeyField(
        "models.User", related_name="reactions", on_delete=fields.CASCADE
    )
    type = fields.CharField(max_length=50)  # like / thanks / checked など
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "reactions"
        unique_together = (
            ("daily_report", "user", "type"),
        )  # 同じユーザーが同じ日報に同じリアクションを複数回できない

    def __str__(self):
        return f"{self.type} on report {self.daily_report_id} by user {self.user_id}"
