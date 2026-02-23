from __future__ import annotations

import discord
from tortoise import fields

from models import BaseDbModel

__all__ = ("TicketConfig", "Ticket")


class TicketConfig(BaseDbModel):
    """Per-guild ticket panel configuration."""

    class Meta:
        table = "ticket_configs"

    id = fields.IntField(pk=True)
    guild_id = fields.BigIntField(index=True)
    channel_id = fields.BigIntField()          # channel where the panel embed lives
    message_id = fields.BigIntField(null=True)  # the panel message snowflake

    category_id = fields.BigIntField(null=True)     # category to create tickets in
    log_channel_id = fields.BigIntField(null=True)   # channel for transcript logs
    support_role_id = fields.BigIntField(null=True)  # role that can see tickets

    title = fields.CharField(max_length=256, default="Support Ticket")
    description = fields.TextField(
        default="Click the button below to open a support ticket.\nOur team will assist you shortly."
    )
    button_label = fields.CharField(max_length=80, default="Open Ticket")
    button_emoji = fields.CharField(max_length=50, null=True, default="🎫")

    max_tickets = fields.SmallIntField(default=1)  # max open tickets per user

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


class Ticket(BaseDbModel):
    """An individual ticket instance."""

    class Meta:
        table = "tickets"

    id = fields.IntField(pk=True)
    guild_id = fields.BigIntField(index=True)
    channel_id = fields.BigIntField(unique=True)
    opener_id = fields.BigIntField()

    config: fields.ForeignKeyRelation[TicketConfig] = fields.ForeignKeyField(
        "models.TicketConfig", related_name="tickets", on_delete=fields.CASCADE
    )

    opened_at = fields.DatetimeField(auto_now_add=True)
    closed_at = fields.DatetimeField(null=True)
    closed_by = fields.BigIntField(null=True)
    reason = fields.TextField(null=True)
