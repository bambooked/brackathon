"""DailyReport model for Tortoise-ORM."""

from tortoise import fields
from tortoise.models import Model


class DailyReport(Model):
    """
    日報テーブル
    ユーザーが投稿する日報を保存
    """

    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField(
        "models.User", related_name="daily_reports", on_delete=fields.CASCADE
    )
    report_date = fields.DateField(index=True)
    title = fields.CharField(max_length=255, null=True)
    body = fields.TextField()  # Markdown形式で保存可能
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    # リレーション（逆参照）
    reactions: fields.ReverseRelation["Reaction"]

    class Meta:
        table = "daily_reports"
        unique_together = (("user", "report_date"),)  # 1日1報のみ
        ordering = ["-report_date", "-created_at"]

    def __str__(self):
        return f"{self.report_date} - {self.title or 'Untitled'}"
