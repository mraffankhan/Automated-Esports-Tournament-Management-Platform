from __future__ import annotations

import discord
from tortoise import fields

from models import BaseDbModel

__all__ = ("BugConfig", "BugTicket")


class BugConfig(BaseDbModel):
    """Per-guild bug panel configuration (restricted to support server)."""

    class Meta:
        table = "bug_configs"

    id = fields.IntField(pk=True)
    guild_id = fields.BigIntField(index=True)
    channel_id = fields.BigIntField()           # channel where the panel embed lives
    message_id = fields.BigIntField(null=True)  # the panel message snowflake

    category_id = fields.BigIntField(null=True)     # category to create bug channels in
    log_channel_id = fields.BigIntField(null=True)   # channel for bug transcripts/logs
    support_role_id = fields.BigIntField(null=True)  # role that can see bugs (developers)

    title = fields.CharField(max_length=256, default="Bug Reporting")
    description = fields.TextField(
        default="Found a bug? Click the button below to report it to the developers."
    )
    button_label = fields.CharField(max_length=80, default="Report Bug")
    button_emoji = fields.CharField(max_length=50, null=True, default="🐛")

    max_bugs = fields.SmallIntField(default=3)  # max open bugs per user

    # --- helpers ---

    @property
    def _guild(self) -> discord.Guild | None:
        return self.bot.get_guild(self.guild_id)

    @property
    def panel_channel(self) -> discord.TextChannel | None:
        if (g := self._guild) is not None:
            return g.get_channel(self.channel_id)

    @property
    def category(self) -> discord.CategoryChannel | None:
        if (g := self._guild) is not None and self.category_id:
            return g.get_channel(self.category_id)

    @property
    def log_channel(self) -> discord.TextChannel | None:
        if (g := self._guild) is not None and self.log_channel_id:
            return g.get_channel(self.log_channel_id)

    @property
    def support_role(self) -> discord.Role | None:
        if (g := self._guild) is not None and self.support_role_id:
            return g.get_role(self.support_role_id)


class BugTicket(BaseDbModel):
    """An individual bug instance."""

    class Meta:
        table = "bugs"

    id = fields.IntField(pk=True)
    guild_id = fields.BigIntField(index=True)
    channel_id = fields.BigIntField(unique=True)
    opener_id = fields.BigIntField(index=True)

    config: fields.ForeignKeyRelation[BugConfig] = fields.ForeignKeyField(
        "models.BugConfig", related_name="bugs", on_delete=fields.CASCADE
    )

    opened_at = fields.DatetimeField(auto_now_add=True)
    closed_at = fields.DatetimeField(null=True)
    closed_by = fields.BigIntField(null=True)
    title = fields.TextField(null=True)
    description = fields.TextField(null=True)
    reproduction_steps = fields.TextField(null=True)
