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

                in_support_server = False
                support_server = self.bot.get_guild(config.SERVER_ID)
                if support_server:
                    member = support_server.get_member(inviter.id)
                    if member:
                        in_support_server = True
                
                if in_support_server:
                    # User is in support server, so they get free premium!
                    g, _ = await Guild.get_or_create(guild_id=guild.id)
                    g.is_premium = True
                    g.made_premium_by = inviter.id
                    await g.save()
                    with suppress(discord.Forbidden):
                        await inviter.send(f"🎉 Thank you for adding me to **{guild.name}**!\nSince you are a member of **RAVONIX HQ**, your server has been automatically upgraded to **ARGON Premium** for free!")

                else:
                    # User is not in support server, ask them to join for free premium
                    with suppress(discord.Forbidden):
                        embed = discord.Embed(
                            title=f"Welcome to Argon!",
                            description=(
                                f"Hey {inviter.mention}, thanks for adding me to {guild.name}!\n\n"
                                "Need Premium for free? Just join my support server and your server will be automatically upgraded!"
                            ),
                            color=config.COLOR
                        )
                        embed.set_footer(text=config.FOOTER)
                        
                        view = discord.ui.View()
                        view.add_item(discord.ui.Button(label="Join RAVONIX HQ", url=config.SERVER_LINK, style=discord.ButtonStyle.link))
                        
                        await inviter.send(embed=embed, view=view)
                break
                break
        except (discord.Forbidden, discord.HTTPException):
            pass

    @Cog.listener()
    async def on_member_join(self, member: discord.Member) -> None:
        # Check if they joined the support server
        if member.guild.id != config.SERVER_ID:
            return
            
        # Get all guilds the bot is in where this member is the owner
        owned_guilds = [g for g in self.bot.guilds if g.owner_id == member.id]
        if not owned_guilds:
            return
            
        upgraded = 0
        for guild in owned_guilds:
            g_db, _ = await Guild.get_or_create(guild_id=guild.id)
            if not g_db.is_premium:
                g_db.is_premium = True
                g_db.made_premium_by = member.id
                await g_db.save()
                upgraded += 1
                
        if upgraded > 0:
            with suppress(discord.Forbidden):
                await member.send(f"🎉 **Welcome to RAVONIX HQ!**\nSince you joined the support server, **{upgraded}** of your servers have been automatically upgraded to **ARGON Premium** for free!")

    @Cog.listener()
    async def on_member_remove(self, member: discord.Member) -> None:
        # Check if they left the support server
        if member.guild.id != config.SERVER_ID:
            return
            
        # Revoke premium from any guild they made premium
        guilds_to_downgrade = await Guild.filter(made_premium_by=member.id, is_premium=True)
        if not guilds_to_downgrade:
            return
            
        downgraded = 0
        for g_db in guilds_to_downgrade:
            g_db.is_premium = False
            g_db.made_premium_by = None
            await g_db.save()
            downgraded += 1
            
        if downgraded > 0:
            with suppress(discord.Forbidden):
                await member.send(f"⚠️ **You left RAVONIX HQ!**\nBecause you left the support server, **{downgraded}** of your servers have lost their free ARGON Premium perks.\n\nRejoin to instantly get Premium back! {config.SERVER_LINK}")

