"""Break Thunder temporary bulletin board messages."""

from tortoise import fields
from tortoise.models import Model


class BreakThunderMessage(Model):
    id = fields.IntField(pk=True)
    team_name = fields.CharField(max_length=255, index=True)
    schedule = fields.ForeignKeyField(
        "models.BreakThunderSchedule",
        related_name="messages",
        on_delete=fields.CASCADE,
    )
    user = fields.ForeignKeyField(
        "models.User",
        related_name="break_thunder_messages",
        on_delete=fields.CASCADE,
    )
    body = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "break_thunder_messages"
        ordering = ["created_at"]
