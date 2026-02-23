from __future__ import annotations

import typing

if typing.TYPE_CHECKING:
    from core import Potato

import asyncio
import inspect
import itertools
import os
from collections import Counter
from datetime import datetime, timedelta, timezone

import discord
import pkg_resources
import psutil
import psutil
try:
    import pygit2
except ImportError:
    pygit2 = None
from discord.ext import commands

from cogs.argonmisc.helper import format_relative
from core import Cog, Context, ArgonView
from models import Commands, Guild, User, Votes
from utils import LinkButton, LinkType, ArgonColor, checks, get_ipm, human_timedelta, truncate_string

from .alerts import *
from .dev import *
from .views import MoneyButton, SetupButtonView, VoteButton
from .noprefix import NoPrefixCmd


class ArgonMisc(Cog, name="ArgonMisc"):
    def __init__(self, bot: Argon):
        self.bot = bot

    @commands.command(aliases=("src",), hidden=True)
    async def source(self, ctx: Context, *, search: typing.Optional[str]):
        """Refer to the source code of the bot commands."""
        source_url = "https://github.com/argonbot/Argon-Bot"

        if search is None:
            return await ctx.send(f"<{source_url}>")

        command = ctx.bot.get_command(search)

        if not command:
            return await ctx.error("Couldn't find that command.")

        src = command.callback.__code__
        filename = src.co_filename
        lines, firstlineno = inspect.getsourcelines(src)

        location = os.path.relpath(filename).replace("\\", "/")

        final_url = f"<{source_url}/blob/main/{location}#L{firstlineno}-L{firstlineno + len(lines) - 1}>"
        await ctx.send(final_url)

    @commands.command(aliases=("inv",))
    async def invite(self, ctx: Context):
        """Argon Invite Links."""
        v = discord.ui.View(timeout=None)
        v.add_item(
            discord.ui.Button(
                style=discord.ButtonStyle.link, label="Invite Argon (Me)", url=self.bot.config.BOT_INVITE, row=1
            )
        )
        v.add_item(
            discord.ui.Button(
                style=discord.ButtonStyle.link, label="Join Support Server", url=self.bot.config.SERVER_LINK, row=2
            )
        )

        await ctx.reply(view=v)

    async def make_private_channel(self, ctx: Context) -> discord.TextChannel:
        support_link = f"[Support Server]({ctx.config.SERVER_LINK})"
        invite_link = f"[Invite Me]({ctx.config.BOT_INVITE})"

        guild = ctx.guild
        overwrites = {
            guild.default_role: discord.PermissionOverwrite(read_messages=False),
            guild.me: discord.PermissionOverwrite(
                read_messages=True,
                send_messages=True,
                read_message_history=True,
                embed_links=True,
                attach_files=True,
                manage_channels=True,
            ),
            ctx.author: discord.PermissionOverwrite(read_messages=True, send_messages=True, read_message_history=True),
        }
        channel = await guild.create_text_channel(
            "argon-private", overwrites=overwrites, reason=f"Made by {str(ctx.author)}"
        )
        await Guild.filter(guild_id=ctx.guild.id).update(private_channel=channel.id)

        e = self.bot.embed(ctx)
        e.add_field(
            name="**What is this channel for?**",
            inline=False,
        value="This channel is made for Argon to send important announcements and activities that need your attention. If anything goes wrong with any of my functionality I will notify you here. Important announcements from the developer will be sent directly here too.\n\nYou can test my commands in this channel if you like. Kindly don't delete it , some of my commands won't work without this channel.",
        )
        e.add_field(
            name="**__Important Links__**", value=f"{support_link} | {invite_link}", inline=False
        )

        links = [LinkType("Support Server", ctx.config.SERVER_LINK)]
        view = LinkButton(links)
        m = await channel.send(embed=e, view=view)
        await m.pin()

        return channel

    @commands.command(name="setup")
    @commands.has_permissions(manage_guild=True)
    @commands.bot_has_guild_permissions(manage_channels=True, manage_webhooks=True)
    async def setup_cmd(self, ctx: Context):
        """
        Setup Argon in the current server.
        This creates a private channel in the server. You can rename that if you like.
        Argon requires manage channels and manage wehooks permissions for this to work.
        You must have manage server permission.
        """

        _view = SetupButtonView(ctx)
        _view.add_item(ArgonView.tricky_invite_button())
        record = await Guild.get(guild_id=ctx.guild.id)

        if record.private_ch is not None:
            return await ctx.error(f"You already have a private channel ({record.private_ch.mention})", view=_view)
        channel = await self.make_private_channel(ctx)
        await ctx.success(f"Created {channel.mention}", view=_view)

    def get_bot_uptime(self, *, brief=False):
        return human_timedelta(self.bot.start_time, accuracy=None, brief=brief, suffix=False)

    @staticmethod
    def format_commit(commit):  # source: R danny
        short, _, _ = commit.message.partition("\n")
        short_sha2 = commit.hex[0:6]
        commit_tz = timezone(timedelta(minutes=commit.commit_time_offset))
        commit_time = datetime.fromtimestamp(commit.commit_time).astimezone(commit_tz)

        # [`hash`](url) message (offset)
        offset = format_relative(commit_time.astimezone(timezone.utc))
        return f"[`{short_sha2}`](https://github.com/argonbot/Argon-Bot/commit/{commit.hex}) {truncate_string(short,40)} ({offset})"

    def get_last_commits(self, count=3):
        if pygit2 is None:
            return "Git info unavailable (pygit2 not installed)"
        repo = pygit2.Repository(".git")
        commits = list(itertools.islice(repo.walk(repo.head.target, pygit2.GIT_SORT_TOPOLOGICAL), count))
        return "\n".join(self.format_commit(c) for c in commits)

    @commands.command(aliases=("stats",))
    @commands.cooldown(1, 10, commands.BucketType.guild)
    async def about(self, ctx: Context):
        """Statistics of Argon."""
        (
            db_latency,
            total_command_uses,
            user_invokes,
            server_invokes,
        ) = await asyncio.gather(
            self.bot.db_latency,
            Commands.all().count(),
            Commands.filter(user_id=ctx.author.id, guild_id=ctx.guild.id).count(),
            Commands.filter(guild_id=ctx.guild.id).count(),
        )
        user_invokes = user_invokes or 0
        server_invokes = server_invokes or 0

        version = pkg_resources.get_distribution("discord.py").version
        revision = self.get_last_commits()

        total_memory = psutil.virtual_memory().total >> 20
        used_memory = psutil.virtual_memory().used >> 20
        cpu_used = str(psutil.cpu_percent())

        total_members = sum(g.member_count for g in self.bot.guilds)
        cached_members = len(self.bot.users)

        chnl_count = Counter(map(lambda ch: ch.type, self.bot.get_all_channels()))

        owner = await self.bot.getch(self.bot.get_user, self.bot.fetch_user, 1449081308616720628)

        msges = self.bot.seen_messages

        embed = discord.Embed(description="Latest Changes:\n" + revision)
        embed.title = "Argon Official Support Server"
        embed.url = ctx.config.SERVER_LINK
        embed.colour = self.bot.color
        embed.set_author(name=str(owner), icon_url=owner.display_avatar.url)

        guild_value = len(self.bot.guilds)

        embed.add_field(name="Servers", value=f"{guild_value:,} total\n{len(self.bot.shards)} shards")
        embed.add_field(name="Uptime", value=f"{self.get_bot_uptime(brief=True)}\n{msges:,} messages seen")
        embed.add_field(name="Members", value=f"{total_members:,} Total\n{cached_members:,} cached")
        embed.add_field(
            name="Channels",
            value=f"{chnl_count[discord.ChannelType.text] + chnl_count[discord.ChannelType.voice]:,} total\n{chnl_count[discord.ChannelType.text]:,} text\n{chnl_count[discord.ChannelType.voice]:,} voice",
        )
        embed.add_field(
            name="Total Commands Used",
            value=f"{total_command_uses:,} globally\n{server_invokes:,} in this server\n{user_invokes:,} by you.",
        )
        prefix = self.bot.cache.guild_data.get(ctx.guild.id, {}).get("prefix", self.bot.config.PREFIX)
        is_np = ctx.author.id in self.bot.cache.noprefix or ctx.author.id in self.bot.config.DEVS
        prefix_display = f"`{prefix}` (No Prefix ✅)" if is_np else f"`{prefix}`"
        embed.add_field(
            name="Stats",
            value=f"Prefix: {prefix_display}\nPing: {round(self.bot.latency * 1000, 2)}ms\nDatabase: {db_latency}\nIPM: {round(get_ipm(ctx.bot), 2)}",
        )
        embed.add_field(name="System", value=f"**RAM**: {used_memory}/{total_memory} MB\n**CPU:** {cpu_used}% used."),
        embed.set_footer(text="Argon by unknown", icon_url="http://i.imgur.com/5BFecvA.png")

        links = [LinkType("Support Server", ctx.config.SERVER_LINK), LinkType("Invite Me", ctx.config.BOT_INVITE)]
        await ctx.send(embed=embed, embed_perms=True, view=LinkButton(links))

    @commands.command()
    async def ping(self, ctx: Context):
        """Check how the bot is doing"""
        await ctx.send(f"Bot: `{round(self.bot.latency*1000, 2)} ms`, Database: `{await self.bot.db_latency}`")

    @commands.command(hidden=True)
    async def voteremind(self, ctx: Context):
        """Get a reminder when your vote expires"""
        check = await Votes.get_or_none(user_id=ctx.author.id)
        if check:
            await Votes.filter(user_id=ctx.author.id).update(reminder=not (check.reminder))
            await ctx.success(f"Turned vote-reminder {'ON' if not check.reminder else 'OFF'}!")
        else:
            await Votes.create(user_id=ctx.author.id, reminder=True)
            await ctx.success(f"Turned vote-reminder ON!")

    @commands.command()
    @commands.has_permissions(manage_guild=True)
    async def prefix(self, ctx: Context, *, new_prefix: str = None):
        """Change your server's prefix"""

        if not new_prefix:
            prefix = self.bot.cache.guild_data[ctx.guild.id].get("prefix", "q")
            return await ctx.simple(f"Prefix for this server is `{prefix}`")

        if len(new_prefix) > 5:
            return await ctx.error(f"Prefix cannot contain more than 5 characters.")

        self.bot.cache.guild_data[ctx.guild.id]["prefix"] = new_prefix
        await Guild.filter(guild_id=ctx.guild.id).update(prefix=new_prefix)
        await ctx.success(f"Updated server prefix to: `{new_prefix}`")

    @commands.command()
    @commands.has_permissions(manage_guild=True)
    @checks.is_premium_guild()
    async def color(self, ctx: Context, *, new_color: ArgonColor = None):
        """Change color of Argon's embeds"""
        if new_color is None:
            current_color = self.bot.cache.guild_color(ctx.guild.id)
            return await ctx.simple(f"The current server color is updated to `{hex(current_color)}`")

        color = int(str(new_color).replace("#", ""), 16)  # The hex value of a color.

        self.bot.cache.guild_data[ctx.guild.id]["color"] = color
        await Guild.filter(guild_id=ctx.guild.id).update(embed_color=color)
        await ctx.success(f"Updated server color.")

    @commands.command()
    @checks.is_premium_guild()
    @commands.has_permissions(manage_guild=True)
    async def footer(self, ctx: Context, *, new_footer: str):
        """Change footer of embeds sent by Argon"""
        if len(new_footer) > 50:
            return await ctx.success(f"Footer cannot contain more than 50 characters.")

        self.bot.cache.guild_data[ctx.guild.id]["footer"] = new_footer
        await Guild.filter(guild_id=ctx.guild.id).update(embed_footer=new_footer)
        await ctx.success(f"Updated server footer.")

    @commands.command(hidden=True)
    async def money(self, ctx: Context):
        user = await User.get(user_id=ctx.author.id)

        e = self.bot.embed(ctx, title="Your Argon Coins")
        e.set_thumbnail(url=self.bot.user.display_avatar.url)

        e.description = (
            f"💰 | You have a total of `{user.money} Argon Coins`.\n"
            f"*Argon Coins can be earned by voting [here]({ctx.config.WEBSITE}/vote)*"
        )

        _view = MoneyButton(ctx)
        if not user.money >= 120:
            _view.children[0] = discord.ui.Button(
                label=f"Claim Prime (120 coins)", custom_id="claim_prime", style=discord.ButtonStyle.grey, disabled=True
            )

        _view.message = await ctx.send(embed=e, embed_perms=True, view=_view)

    @commands.command(hidden=True)
    async def vote(self, ctx: Context):
        e = self.bot.embed(ctx, title="Vote for Argon")
        e.description = (
            "**Rewards**\n"
            "<a:roocool:962749077831942276> Voter Role `12 hrs`\n"
            f"{self.bot.config.PRIME_EMOJI} Argon Coin `x1`"
        )
        e.set_thumbnail(url=self.bot.user.display_avatar.url)

        _view = VoteButton(ctx)

        vote = await Votes.get_or_none(pk=ctx.author.id)
        if vote and vote.is_voter:
            _b: discord.ui.Button = discord.ui.Button(
                disabled=True,
                style=discord.ButtonStyle.grey,
                custom_id="vote_argon",
                label=f"Vote in {human_timedelta(vote.expire_time,accuracy=1,suffix=False)}",
            )
            _view.children[0] = _b

        e.set_footer(text="Argon by unknown")
        _view.message = await ctx.send(embed=e, view=_view, embed_perms=True)

    @commands.command(hidden=True)
    async def dashboard(self, ctx: Context):
        await ctx.send(
            f"Here is the direct link to this server's dashboard:\n<{self.bot.config.WEBSITE}/dashboard/{ctx.guild.id}>"
        )

    @commands.hybrid_command(hidden=True)
    @commands.cooldown(1, 5, commands.BucketType.user)
    async def contributors(self, ctx):
        """People who made Argon Possible."""
        url = f"https://api.github.com/repos/argonbot/Argon-Bot/contributors"

        e = discord.Embed(title=f"Project Contributors", color=self.bot.color, timestamp=self.bot.current_time)
        e.description = ""
        async with self.bot.session.get(url) as response:
            data = await response.json()
            for idx, contributor in enumerate(data, start=1):
                if contributor["type"] == "Bot":
                    continue

                e.description += (
                    f"`{idx:02}.` [{contributor['login']} ({contributor['contributions']})]({contributor['html_url']})\n"
                )

        await ctx.send(embed=e)


async def setup(bot: Argon) -> None:
    await bot.add_cog(ArgonMisc(bot))
    await bot.add_cog(Dev(bot))
    await bot.add_cog(ArgonAlerts(bot))
    await bot.add_cog(NoPrefixCmd(bot))
