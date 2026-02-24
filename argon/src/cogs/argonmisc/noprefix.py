from __future__ import annotations

from typing import Union, Optional
from datetime import datetime

import discord
from discord.ext import commands

from core import Cog, Context
from models import NoPrefix
from utils import ArgonMember, human_timedelta
from utils.time import FutureTime


class NoPrefixCmd(Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.group(invoke_without_command=True, aliases=["np"])
    @commands.is_owner()
    async def noprefix(self, ctx: Context):
        """
        Manage no-prefix users.

        Commands:
          `np add @user [time]` → Add user-level NP
          `np remove @user` → Remove user-level NP
          `np server add @user [time]` → Add server-level NP (this server only)
          `np server remove @user` → Remove server-level NP
          `np list` → Show all NP users
        """
        await ctx.send_help(ctx.command)

    # ─── User-level NP ───────────────────────────────────────────────────────

    @noprefix.command(name="add", aliases=["give"])
    @commands.is_owner()
    async def noprefix_add(self, ctx: Context, user: Optional[ArgonMember] = None, time_arg: Optional[FutureTime] = None):
        """Add a user to the global no-prefix list."""
        if user is None:
            if ctx.message.reference:
                msg = await ctx.channel.fetch_message(ctx.message.reference.message_id)
                user = msg.author
            else:
                return await ctx.error("Please mention a user or reply to one.")

        if user.id in self.bot.cache.noprefix and self.bot.cache.noprefix[user.id] is None:
            return await ctx.error(f"{user.mention} already has permanent no-prefix.")

        expires_at = time_arg.dt if time_arg else None

        await NoPrefix.update_or_create(
            user_id=user.id,
            defaults={"expires_at": expires_at, "np_type": "user", "guild_id": None},
        )
        self.bot.cache.noprefix[user.id] = expires_at

        msg = f"✅ Added {user.mention} to no-prefix (global)"
        if expires_at:
            msg += f" until {human_timedelta(expires_at)}."
        else:
            msg += " permanently."

        await ctx.send(msg)

    @noprefix.command(name="remove", aliases=["del", "rm"])
    @commands.is_owner()
    async def noprefix_remove(self, ctx: Context, user: Optional[ArgonMember] = None):
        """Remove a user from the global no-prefix list."""
        if user is None:
            if ctx.message.reference:
                msg = await ctx.channel.fetch_message(ctx.message.reference.message_id)
                user = msg.author
            else:
                return await ctx.error("Please mention a user or reply to one.")

        if user.id not in self.bot.cache.noprefix:
            return await ctx.error(f"{user.mention} is not in the no-prefix list.")

        await NoPrefix.filter(user_id=user.id, np_type="user").delete()
        if user.id in self.bot.cache.noprefix:
            del self.bot.cache.noprefix[user.id]

        await ctx.send(f"✅ Removed {user.mention} from global no-prefix.")

    # ─── Server-level NP ─────────────────────────────────────────────────────

    @noprefix.group(name="server", aliases=["s", "guild"], invoke_without_command=True)
    @commands.is_owner()
    async def noprefix_server(self, ctx: Context):
        """Manage server-level no-prefix (applies only in this server)."""
        await ctx.send_help(ctx.command)

    @noprefix_server.command(name="add", aliases=["give"])
    @commands.is_owner()
    async def noprefix_server_add(self, ctx: Context, user: Optional[ArgonMember] = None, time_arg: Optional[FutureTime] = None):
        """Add a user to the server-level no-prefix list."""
        if user is None:
            if ctx.message.reference:
                msg = await ctx.channel.fetch_message(ctx.message.reference.message_id)
                user = msg.author
            else:
                return await ctx.error("Please mention a user or reply to one.")

        # Check if already has server NP for this guild
        existing = await NoPrefix.get_or_none(user_id=user.id, np_type="server", guild_id=ctx.guild.id)
        if existing:
            return await ctx.error(f"{user.mention} already has server-level no-prefix here.")

        expires_at = time_arg.dt if time_arg else None

        # Server NP uses a generated PK since user_id is PK
        # We'll use update_or_create with user_id as key
        await NoPrefix.update_or_create(
            user_id=user.id,
            defaults={"expires_at": expires_at, "np_type": "server", "guild_id": ctx.guild.id},
        )
        self.bot.cache.noprefix[user.id] = expires_at

        msg = f"✅ Added {user.mention} to no-prefix (server: **{ctx.guild.name}**)"
        if expires_at:
            msg += f" until {human_timedelta(expires_at)}."
        else:
            msg += " permanently."

        await ctx.send(msg)

    @noprefix_server.command(name="remove", aliases=["del", "rm"])
    @commands.is_owner()
    async def noprefix_server_remove(self, ctx: Context, user: Optional[ArgonMember] = None):
        """Remove a user from the server-level no-prefix list."""
        if user is None:
            if ctx.message.reference:
                msg = await ctx.channel.fetch_message(ctx.message.reference.message_id)
                user = msg.author
            else:
                return await ctx.error("Please mention a user or reply to one.")

        deleted = await NoPrefix.filter(user_id=user.id, np_type="server", guild_id=ctx.guild.id).delete()
        if not deleted:
            return await ctx.error(f"{user.mention} doesn't have server-level no-prefix here.")

        # Only remove from cache if no other NP entries exist
        remaining = await NoPrefix.filter(user_id=user.id).exists()
        if not remaining and user.id in self.bot.cache.noprefix:
            del self.bot.cache.noprefix[user.id]

        await ctx.send(f"✅ Removed {user.mention} from server-level no-prefix.")

    # ─── List ─────────────────────────────────────────────────────────────────

    @noprefix.command(name="list", aliases=["ls", "all"])
    @commands.is_owner()
    async def noprefix_list(self, ctx: Context):
        """Show all no-prefix users."""
        records = await NoPrefix.all().order_by("-added_at")

        if not records:
            return await ctx.error("No users in the no-prefix list.")

        lines = []
        for r in records:
            user = self.bot.get_user(r.user_id)
            if user is None:
                try:
                    user = await self.bot.fetch_user(r.user_id)
                except Exception:
                    user = None
            user_display = f"{user} ({user.mention})" if user else f"Unknown (`{r.user_id}`)"

            if r.np_type == "server" and r.guild_id:
                guild = self.bot.get_guild(r.guild_id)
                guild_name = guild.name if guild else str(r.guild_id)
                type_label = f"🏠 {guild_name}"
            else:
                type_label = "🌐 Global"

            if r.expires_at:
                exp = f"expires {human_timedelta(r.expires_at)}"
            else:
                exp = "permanent"

            lines.append(f"• {user_display} — {type_label} — {exp}")

        embed = discord.Embed(
            title="📋 No-Prefix Users",
            description="\n".join(lines[:25]),
            color=self.bot.color,
        )
        if len(lines) > 25:
            embed.set_footer(text=f"Showing 25/{len(lines)} entries")

        await ctx.send(embed=embed)
