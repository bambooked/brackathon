from tortoise import fields
from tortoise.models import Model


class BreakThunderSchedule(Model):
    id = fields.IntField(pk=True)
    team_name = fields.CharField(max_length=255)
    triggered_by_user = fields.ForeignKeyField(
        "models.User", related_name="break_thunder_schedules"
    )
    scheduled_at = fields.DatetimeField()
    status = fields.CharField(max_length=50, default="pending")  # pending / fired
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "break_thunder_schedules"
