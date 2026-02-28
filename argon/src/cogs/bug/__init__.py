from __future__ import annotations

import asyncio
from contextlib import suppress
from datetime import datetime, timezone
from io import BytesIO
from typing import Optional

import discord
from discord.ext import commands

import config as cfg
from constants import IST
from core import Cog, Context
from models.misc.bug import BugConfig, BugTicket


# ─── Persistent Panel View (button users click to open a bug report) ────────────
class BugPanelView(discord.ui.View):
    """Persistent view attached to the bug panel message."""

    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="Report Bug",
        emoji="🐛",
        style=discord.ButtonStyle.red,
        custom_id="bug:open",
    )
    async def open_bug(self, interaction: discord.Interaction, button: discord.ui.Button):
        # Additional safety check to only allow inside support server
        server_id = getattr(cfg, "SERVER_ID", None)
        if str(interaction.guild_id) != str(server_id):
            return await interaction.response.send_message(
                f"Bug reporting is only available in the support server.", ephemeral=True
            )
        await interaction.response.send_modal(BugOpenModal())


# ─── Modal: ask for bug details when opening ────────────────────────────────
class BugOpenModal(discord.ui.Modal, title="Report a Bug"):
    bug_title = discord.ui.TextInput(
        label="Bug Title",
        placeholder="Short description of the issue…",
        style=discord.TextStyle.short,
        required=True,
        max_length=100,
    )
    
    description = discord.ui.TextInput(
        label="Description",
        placeholder="Detailed explanation of what the bug is…",
        style=discord.TextStyle.paragraph,
        required=True,
        max_length=1000,
    )
    
    reproduction_steps = discord.ui.TextInput(
        label="Steps to Reproduce",
        placeholder="1. Run command X\n2. Click button Y\n3. Error happens…",
        style=discord.TextStyle.paragraph,
        required=False,
        max_length=1000,
    )

    async def on_submit(self, interaction: discord.Interaction):
        guild = interaction.guild
        user = interaction.user

        config = await BugConfig.get_or_none(guild_id=guild.id)
        if config is None:
            return await interaction.response.send_message(
                "Bug system is not configured in this server.", ephemeral=True
            )

        # Check max open bug reports
        open_count = await BugTicket.filter(
            guild_id=guild.id, opener_id=user.id, closed_at__isnull=True
        ).count()
        if open_count >= config.max_bugs:
            return await interaction.response.send_message(
                f"You already have {open_count} open bug report(s). Maximum is {config.max_bugs}.",
                ephemeral=True,
            )

        await interaction.response.defer(ephemeral=True)

        # Build permission overwrites for the created channel
        overwrites = {
            guild.default_role: discord.PermissionOverwrite(view_channel=False),
            guild.me: discord.PermissionOverwrite(
                view_channel=True, send_messages=True, manage_channels=True,
                read_message_history=True, attach_files=True, embed_links=True,
            ),
            user: discord.PermissionOverwrite(
                view_channel=True, send_messages=True, read_message_history=True,
                attach_files=True, embed_links=True,
            ),
        }
        if config.support_role and (role := guild.get_role(config.support_role_id)):
            overwrites[role] = discord.PermissionOverwrite(
                view_channel=True, send_messages=True, read_message_history=True,
            )

        category = config.category
        bug_number = await BugTicket.filter(guild_id=guild.id).count() + 1

        try:
            channel = await guild.create_text_channel(
                name=f"bug-{bug_number:04d}",
                category=category,
                overwrites=overwrites,
                reason=f"Bug reported by {user}",
            )
        except discord.Forbidden:
            return await interaction.followup.send(
                "I don't have permission to create channels.", ephemeral=True
            )

        bug = await BugTicket.create(
            guild_id=guild.id,
            channel_id=channel.id,
            opener_id=user.id,
            config=config,
            title=str(self.bug_title),
            description=str(self.description),
            reproduction_steps=str(self.reproduction_steps) if self.reproduction_steps.value else None,
        )

        # Send the welcome embed inside the bug channel
        embed = discord.Embed(
            title=f"Bug Report #{bug_number:04d}: {self.bug_title.value}",
            color=cfg.COLOR,
            timestamp=datetime.now(tz=IST),
        )
        embed.description = f"**Reported by:** {user.mention}\n\n"
        embed.add_field(name="Description", value=self.description.value, inline=False)
        if self.reproduction_steps.value:
            embed.add_field(name="Reproduction Steps", value=self.reproduction_steps.value, inline=False)

        embed.set_footer(text=f"{cfg.FOOTER} | Developers will review this shortly")

        view = BugControlView()
        msg = await channel.send(
            content=user.mention + (f" | <@&{config.support_role_id}>" if config.support_role_id else ""),
            embed=embed,
            view=view,
            allowed_mentions=discord.AllowedMentions(users=True, roles=True),
        )
        await msg.pin()

        await interaction.followup.send(
            f"Your bug report has been created: {channel.mention}", ephemeral=True
        )


# ─── Inside-bug channel control buttons ─────────────────────────────────────
class BugControlView(discord.ui.View):
    """Persistent view inside each bug channel."""

    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Resolve / Close", emoji="✅", style=discord.ButtonStyle.green, custom_id="bug:close")
    async def close_bug(self, interaction: discord.Interaction, button: discord.ui.Button):
        # Only allow developers to close a bug report
        if interaction.user.id not in cfg.DEVS and str(interaction.user.id) not in [str(d) for d in cfg.DEVS]:
            return await interaction.response.send_message("Only developers can close bug reports.", ephemeral=True)
            
        embed = discord.Embed(
            description="Are you sure you want to resolve and close this bug report?",
            color=discord.Color.green(),
        )
        await interaction.response.send_message(embed=embed, view=BugCloseConfirm(), ephemeral=True)

    @discord.ui.button(label="Transcript", emoji="📝", style=discord.ButtonStyle.grey, custom_id="bug:transcript")
    async def transcript(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer(ephemeral=True)

        bug = await BugTicket.get_or_none(channel_id=interaction.channel.id)
        if bug is None:
            return await interaction.followup.send("This is not a bug report channel.", ephemeral=True)

        messages = [msg async for msg in interaction.channel.history(limit=500, oldest_first=True)]
        transcript_lines = []
        for msg in messages:
            timestamp = msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
            content = msg.content or "[embed/attachment]"
            transcript_lines.append(f"[{timestamp}] {msg.author}: {content}")

        text = "\n".join(transcript_lines)
        fp = BytesIO(text.encode("utf-8"))
        file = discord.File(fp, filename=f"transcript-{interaction.channel.name}.txt")
        await interaction.followup.send("Here is the transcript:", file=file, ephemeral=True)


# ─── Close confirmation ─────────────────────────────────────────────────────
class BugCloseConfirm(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=30)

    @discord.ui.button(label="Confirm Close", style=discord.ButtonStyle.green, custom_id="bug:close_confirm")
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id not in cfg.DEVS and str(interaction.user.id) not in [str(d) for d in cfg.DEVS]:
            return await interaction.response.send_message("Only developers can close bug reports.", ephemeral=True)

        bug = await BugTicket.get_or_none(channel_id=interaction.channel.id)
        if bug is None:
            return await interaction.response.send_message("This is not a bug report channel.", ephemeral=True)

        await interaction.response.defer()

        # Update DB
        bug.closed_at = datetime.now(tz=timezone.utc)
        bug.closed_by = interaction.user.id
        await bug.save()

        config = await BugConfig.get(id=bug.config_id)

        # Generate and send transcript to log channel
        if config.log_channel_id:
            log_ch = interaction.guild.get_channel(config.log_channel_id)
            if log_ch:
                messages = [msg async for msg in interaction.channel.history(limit=500, oldest_first=True)]
                transcript_lines = []
                for msg in messages:
                    timestamp = msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
                    content = msg.content or "[embed/attachment]"
                    transcript_lines.append(f"[{timestamp}] {msg.author}: {content}")

                text = "\n".join(transcript_lines)
                fp = BytesIO(text.encode("utf-8"))
                file = discord.File(fp, filename=f"bug_report-{interaction.channel.name}.txt")

                opener = interaction.guild.get_member(bug.opener_id) or f"User {bug.opener_id}"
                embed = discord.Embed(
                    title=f"Bug Report Resolved — {interaction.channel.name}",
                    description=(
                        f"**Reported by:** {opener}\n"
                        f"**Resolved by:** {interaction.user.mention}\n"
                        f"**Title:** {bug.title}"
                    ),
                    color=discord.Color.green(),
                    timestamp=datetime.now(tz=IST),
                )
                await log_ch.send(embed=embed, file=file)

        await interaction.channel.send(
            embed=discord.Embed(
                description=f"✅ Bug report closed by {interaction.user.mention}. This channel will be deleted in 5 seconds.",
                color=discord.Color.green(),
            )
        )
        await asyncio.sleep(5)

        with suppress(discord.HTTPException):
            await interaction.channel.delete(reason=f"Bug report closed by {interaction.user}")

    @discord.ui.button(label="Cancel", style=discord.ButtonStyle.grey)
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Bug close cancelled.", ephemeral=True)
        self.stop()


# ─── Verification Check ──────────────────────────────────────────────────────
def is_dev_and_support_server():
    """Custom check that verifies the command is run by a dev in the support server."""
    async def predicate(ctx: Context) -> bool:
        if ctx.guild is None:
            raise commands.CheckFailure("This command cannot be used in DMs.")
            
        server_id = getattr(cfg, "SERVER_ID", None)
        if str(ctx.guild.id) != str(server_id):
            raise commands.CheckFailure(f"This command can only be used in the designated Support Server. (You are in: {ctx.guild.id}, but config expects: {server_id})")
            
        if ctx.author.id not in getattr(cfg, "DEVS", ()) and str(ctx.author.id) not in [str(d) for d in getattr(cfg, "DEVS", ())]:
            raise commands.CheckFailure("This command can only be used by Argon developers.")
        return True
    return commands.check(predicate)

# ─── Cog ─────────────────────────────────────────────────────────────────────
class BugSystem(Cog, name="Bug Reporting"):
    """Complete bug reporting system for the support server."""

    def __init__(self, bot):
        self.bot = bot

    @commands.group(invoke_without_command=True, hidden=True)
    @is_dev_and_support_server()
    async def bug(self, ctx: Context):
        """Bug reporting system commands. Restricted to developers."""
        await ctx.send_help(ctx.command)

    @bug.command(name="setup")
    @is_dev_and_support_server()
    async def bug_setup(self, ctx: Context):
        """Interactive setup wizard for the bug reporting system."""
        guild = ctx.guild

        existing = await BugConfig.filter(guild_id=guild.id).count()
        if existing >= 1:
            return await ctx.error("A bug reporting panel is already configured for this server.")

        embed = discord.Embed(
            title="🐛 Bug Reporting Setup",
            description="Let's set up the bug reporting system!\n\n"
                        "**Step 1/4:** Mention the **category** where bug threads/channels should be created.\n"
                        "Type `skip` to let me create one.",
            color=ctx.guild_color,
        )
        setup_msg = await ctx.send(embed=embed)

        def check(m):
            return m.author == ctx.author and m.channel == ctx.channel

        # Step 1: Category
        category_id = None
        try:
            msg = await self.bot.wait_for("message", check=check, timeout=60)
            if msg.content.lower() != "skip":
                if msg.channel_mentions:
                    cat = msg.channel_mentions[0]
                    if isinstance(cat, discord.CategoryChannel):
                        category_id = cat.id
                elif msg.content.isdigit():
                    category_id = int(msg.content)

            if category_id is None:
                cat = await guild.create_category("Bug Reports")
                category_id = cat.id

            with suppress(discord.HTTPException):
                await msg.delete()
        except asyncio.TimeoutError:
            return await ctx.error("Setup timed out.")

        # Step 2: Support role (Developer role to ping)
        embed.description = "**Step 2/4:** Mention the **developer role** that should be pinged for bugs.\nType `skip` to skip."
        await setup_msg.edit(embed=embed)

        support_role_id = None
        try:
            msg = await self.bot.wait_for("message", check=check, timeout=60)
            if msg.content.lower() != "skip" and msg.role_mentions:
                support_role_id = msg.role_mentions[0].id
            with suppress(discord.HTTPException):
                await msg.delete()
        except asyncio.TimeoutError:
            return await ctx.error("Setup timed out.")

        # Step 3: Log channel
        embed.description = "**Step 3/4:** Mention the **log channel** for resolved bug transcripts.\nType `skip` to skip."
        await setup_msg.edit(embed=embed)

        log_channel_id = None
        try:
            msg = await self.bot.wait_for("message", check=check, timeout=60)
            if msg.content.lower() != "skip" and msg.channel_mentions:
                log_channel_id = msg.channel_mentions[0].id
            with suppress(discord.HTTPException):
                await msg.delete()
        except asyncio.TimeoutError:
            return await ctx.error("Setup timed out.")

        # Step 4: Panel channel
        embed.description = "**Step 4/4:** Mention the **channel** where the bug reporting panel should be posted."
        await setup_msg.edit(embed=embed)

        try:
            msg = await self.bot.wait_for("message", check=check, timeout=60)
            if not msg.channel_mentions:
                return await ctx.error("You must mention a channel.")
            panel_channel = msg.channel_mentions[0]
            with suppress(discord.HTTPException):
                await msg.delete()
        except asyncio.TimeoutError:
            return await ctx.error("Setup timed out.")

        # Create or update config
        config, _ = await BugConfig.get_or_create(
            guild_id=guild.id,
            defaults={
                "channel_id": panel_channel.id,
                "category_id": category_id,
                "log_channel_id": log_channel_id,
                "support_role_id": support_role_id,
            },
        )
        if not _:
            config.channel_id = panel_channel.id
            config.category_id = category_id
            config.log_channel_id = log_channel_id
            config.support_role_id = support_role_id
            await config.save()

        # Post the panel embed
        panel_embed = discord.Embed(
            title=config.title,
            description=config.description,
            color=discord.Color.red(),
        )
        panel_embed.set_footer(text=cfg.FOOTER)

        view = BugPanelView()
        panel_msg = await panel_channel.send(embed=panel_embed, view=view)

        config.message_id = panel_msg.id
        await config.save()

        with suppress(discord.HTTPException):
            await setup_msg.delete()
        await ctx.success(f"Bug reporting panel posted in {panel_channel.mention}!")


async def setup(bot) -> None:
    await bot.add_cog(BugSystem(bot))
