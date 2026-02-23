from __future__ import annotations

import typing
from collections import defaultdict

if typing.TYPE_CHECKING:
    from core import Argon

import re
from contextlib import suppress

import discord

import config
from constants import random_greeting
from core import Cog, Context, cooldown
from models import Guild


class MentionLimits(defaultdict):
    def __missing__(self, key):
        r = self[key] = cooldown.ArgonRatelimiter(2, 12)
        return r


class MainEvents(Cog, name="Main Events"):
    def __init__(self, bot: Argon) -> None:
        self.bot = bot
        self.mentions_limiter = MentionLimits(cooldown.ArgonRatelimiter)

    # incomplete?, I know
    @Cog.listener()
    async def on_guild_join(self, guild: discord.Guild) -> None:
        with suppress(AttributeError):
            g, b = await Guild.get_or_create(guild_id=guild.id)
            self.bot.cache.guild_data[guild.id] = {
                "prefix": g.prefix,
                "color": g.embed_color or self.bot.color,
                "footer": g.embed_footer or config.FOOTER,
            }
            self.bot.loop.create_task(guild.chunk())

        # Check inviter and DM if not in support server
        try:
            async for entry in guild.audit_logs(limit=1, action=discord.AuditLogAction.bot_add):
                inviter = entry.user
                if inviter.bot:
                    return

                should_invite = True
                support_server = self.bot.get_guild(config.SERVER_ID)
                if support_server:
                    member = support_server.get_member(inviter.id)
                    if member:
                        should_invite = False
                
                if should_invite:
                    with suppress(discord.Forbidden):
                        embed = discord.Embed(
                            title=f"Thanks for adding me to {guild.name}!",
                            description=(
                                f"Hey {inviter.mention}, I noticed you aren't in my support server yet.\n"
                                "Join us to get updates, support, and meet the community!"
                            ),
                            color=config.COLOR
                        )
                        embed.set_footer(text=config.FOOTER)
                        
                        view = discord.ui.View()
                        view.add_item(discord.ui.Button(label="Accept Invite", url=config.SERVER_LINK, style=discord.ButtonStyle.link))
                        
                        await inviter.send(embed=embed, view=view)
                break
        except (discord.Forbidden, discord.HTTPException):
            pass

    @Cog.listener()
    async def on_message(self, message: discord.Message) -> None:
        if message.author.bot or message.guild is None:
            return

        if re.match(f"^<@!?{self.bot.user.id}>$", message.content):
            if self.mentions_limiter[message.author].is_ratelimited(message.author):
                return

            ctx: Context = await self.bot.get_context(message)
            self.bot.dispatch("mention", ctx)

    @Cog.listener()
    async def on_mention(self, ctx: Context) -> None:
        prefix: str = self.bot.cache.guild_data[ctx.guild.id].get("prefix", "q")
        await ctx.send(
            f"{random_greeting()} You seem lost. Are you?\n"
            f"Current prefix for this server is: `{prefix}`.\n\nUse it like: `{prefix}help`"
        )
