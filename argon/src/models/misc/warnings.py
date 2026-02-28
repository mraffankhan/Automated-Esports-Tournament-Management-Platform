from tortoise import fields

from models import BaseDbModel

class Warning(BaseDbModel):
    class Meta:
        table = "warnings"

    id = fields.IntField(pk=True)
    guild_id = fields.BigIntField(index=True)
    user_id = fields.BigIntField(index=True)
    moderator_id = fields.BigIntField()
    reason = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)
