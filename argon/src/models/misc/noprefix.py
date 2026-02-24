from tortoise import fields
from models import BaseDbModel

__all__ = ("NoPrefix",)


class NoPrefix(BaseDbModel):
    """Users who can use the bot without a prefix."""

    class Meta:
        table = "misc_noprefix"

    user_id = fields.BigIntField(pk=True, description="Discord User ID")
    added_at = fields.DatetimeField(auto_now_add=True)
    expires_at = fields.DatetimeField(null=True)
    np_type = fields.CharField(max_length=10, default="user", description="'user' or 'server'")
    guild_id = fields.BigIntField(null=True, description="Guild ID if server-level NP")

    def __str__(self):
        return str(self.user_id)
