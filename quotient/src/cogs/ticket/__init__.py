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
from models.misc.ticket import Ticket, TicketConfig


# ─── Persistent Panel View (button users click to open a ticket) ────────────
class TicketPanelView(discord.ui.View):
    """Persistent view attached to the ticket panel message."""

    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="Open Ticket",
        emoji="🎫",
        style=discord.ButtonStyle.blurple,
        custom_id="ticket:open",
    )
    async def open_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(TicketOpenModal())


# ─── Modal: ask reason when opening ─────────────────────────────────────────
class TicketOpenModal(discord.ui.Modal, title="Open a Ticket"):
    reason = discord.ui.TextInput(
        label="Reason",
        placeholder="Briefly describe your issue…",
        style=discord.TextStyle.paragraph,
        required=False,
        max_length=1024,
    )

    async def on_submit(self, interaction: discord.Interaction):
        guild = interaction.guild
        user = interaction.user

        config = await TicketConfig.get_or_none(guild_id=guild.id)
        if config is None:
            return await interaction.response.send_message(
                "Ticket system is not configured in this server.", ephemeral=True
            )

        # Check max open tickets
        open_count = await Ticket.filter(
            guild_id=guild.id, opener_id=user.id, closed_at__isnull=True
        ).count()
        if open_count >= config.max_tickets:
            return await interaction.response.send_message(
                f"You already have {open_count} open ticket(s). Maximum is {config.max_tickets}.",
                ephemeral=True,
            )

        await interaction.response.defer(ephemeral=True)

        # Build permission overwrites
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
        ticket_number = await Ticket.filter(guild_id=guild.id).count() + 1

        try:
            channel = await guild.create_text_channel(
                name=f"ticket-{ticket_number:04d}",
                category=category,
                overwrites=overwrites,
                reason=f"Ticket opened by {user}",
            )
        except discord.Forbidden:
            return await interaction.followup.send(
                "I don't have permission to create channels.", ephemeral=True
            )

        ticket = await Ticket.create(
            guild_id=guild.id,
            channel_id=channel.id,
            opener_id=user.id,
            config=config,
            reason=str(self.reason) or None,
        )

        # Send the welcome embed inside the ticket channel
        embed = discord.Embed(
            title=f"Ticket #{ticket_number:04d}",
            description=(
                f"**Opened by:** {user.mention}\n"
                f"**Reason:** {self.reason.value or 'No reason provided'}\n\n"
                "A staff member will be with you shortly.\n"
                "Use the buttons below to manage this ticket."
            ),
            color=cfg.COLOR,
            timestamp=datetime.now(tz=IST),
        )
        embed.set_footer(text=f"{cfg.FOOTER}")

        view = TicketControlView()
        msg = await channel.send(
            content=user.mention + (f" | <@&{config.support_role_id}>" if config.support_role_id else ""),
            embed=embed,
            view=view,
            allowed_mentions=discord.AllowedMentions(users=True, roles=True),
        )
        await msg.pin()

        await interaction.followup.send(
            f"Your ticket has been created: {channel.mention}", ephemeral=True
        )


# ─── Inside-ticket control buttons ──────────────────────────────────────────
class TicketControlView(discord.ui.View):
    """Persistent view inside each ticket channel."""

    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Close", emoji="🔒", style=discord.ButtonStyle.red, custom_id="ticket:close")
    async def close_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        embed = discord.Embed(
            description="Are you sure you want to close this ticket?",
            color=discord.Color.red(),
        )
        await interaction.response.send_message(embed=embed, view=TicketCloseConfirm(), ephemeral=True)

    @discord.ui.button(label="Transcript", emoji="📝", style=discord.ButtonStyle.grey, custom_id="ticket:transcript")
    async def transcript(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer(ephemeral=True)

        ticket = await Ticket.get_or_none(channel_id=interaction.channel.id)
        if ticket is None:
            return await interaction.followup.send("This is not a ticket channel.", ephemeral=True)

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
class TicketCloseConfirm(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=30)

    @discord.ui.button(label="Confirm Close", style=discord.ButtonStyle.red, custom_id="ticket:close_confirm")
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        ticket = await Ticket.get_or_none(channel_id=interaction.channel.id)
        if ticket is None:
            return await interaction.response.send_message("This is not a ticket channel.", ephemeral=True)

        await interaction.response.defer()

        # Update DB
        ticket.closed_at = datetime.now(tz=timezone.utc)
        ticket.closed_by = interaction.user.id
        await ticket.save()

        config = await TicketConfig.get(id=ticket.config_id)

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
                file = discord.File(fp, filename=f"transcript-{interaction.channel.name}.txt")

                opener = interaction.guild.get_member(ticket.opener_id) or f"User {ticket.opener_id}"
                embed = discord.Embed(
                    title=f"Ticket Closed — {interaction.channel.name}",
                    description=(
                        f"**Opened by:** {opener}\n"
                        f"**Closed by:** {interaction.user.mention}\n"
                        f"**Reason:** {ticket.reason or 'N/A'}"
                    ),
                    color=discord.Color.red(),
                    timestamp=datetime.now(tz=IST),
                )
                await log_ch.send(embed=embed, file=file)

        await interaction.channel.send(
            embed=discord.Embed(
                description=f"🔒 Ticket closed by {interaction.user.mention}. This channel will be deleted in 5 seconds.",
                color=discord.Color.red(),
            )
        )
        await asyncio.sleep(5)

        with suppress(discord.HTTPException):
            await interaction.channel.delete(reason=f"Ticket closed by {interaction.user}")

    @discord.ui.button(label="Cancel", style=discord.ButtonStyle.grey)
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Ticket close cancelled.", ephemeral=True)
        self.stop()


# ─── Cog ─────────────────────────────────────────────────────────────────────
class TicketSystem(Cog, name="Ticket"):
    """Complete ticket system for support management."""

    def __init__(self, bot):
        self.bot = bot

    @commands.group(invoke_without_command=True)
    @commands.has_permissions(manage_guild=True)
    async def ticket(self, ctx: Context):
        """Ticket system commands. Use `aticket setup` to get started."""
        await ctx.send_help(ctx.command)

    @ticket.command(name="setup")
    @commands.has_permissions(manage_guild=True)
    @commands.bot_has_guild_permissions(manage_channels=True)
    async def ticket_setup(self, ctx: Context):
        """Interactive setup wizard for the ticket system."""
        guild = ctx.guild

        # Free: 1 ticket panel per server. Premium: unlimited.
        existing = await TicketConfig.filter(guild_id=guild.id).count()
        if existing >= 1:
            from models import Guild as GuildModel, User as UserModel

            guild_check = await GuildModel.get_or_none(guild_id=guild.id)
            user_check = await UserModel.get_or_none(user_id=ctx.author.id)
            is_premium = (guild_check and guild_check.is_premium) or (user_check and user_check.is_premium)

            if not is_premium:
                return await ctx.premium_mango(
                    "You already have a ticket panel configured.\n"
                    "Upgrade to **Argon Premium** to create multiple ticket panels."
                )

        embed = discord.Embed(
            title="🎫 Ticket Setup",
            description="Let's set up the ticket system! Answer the following questions.\n\n"
                        "**Step 1/4:** Mention the **category** where tickets should be created.\n"
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
                cat = await guild.create_category("Tickets")
                category_id = cat.id

            await msg.delete()
        except asyncio.TimeoutError:
            return await ctx.error("Setup timed out.")

        # Step 2: Support role
        embed.description = "**Step 2/4:** Mention the **support role** that should see tickets.\nType `skip` to skip."
        await setup_msg.edit(embed=embed)

        support_role_id = None
        try:
            msg = await self.bot.wait_for("message", check=check, timeout=60)
            if msg.content.lower() != "skip" and msg.role_mentions:
                support_role_id = msg.role_mentions[0].id
            await msg.delete()
        except asyncio.TimeoutError:
            return await ctx.error("Setup timed out.")

        # Step 3: Log channel
        embed.description = "**Step 3/4:** Mention the **log channel** for transcripts.\nType `skip` to skip."
        await setup_msg.edit(embed=embed)

        log_channel_id = None
        try:
            msg = await self.bot.wait_for("message", check=check, timeout=60)
            if msg.content.lower() != "skip" and msg.channel_mentions:
                log_channel_id = msg.channel_mentions[0].id
            await msg.delete()
        except asyncio.TimeoutError:
            return await ctx.error("Setup timed out.")

        # Step 4: Panel channel
        embed.description = "**Step 4/4:** Mention the **channel** where the ticket panel should be posted."
        await setup_msg.edit(embed=embed)

        try:
            msg = await self.bot.wait_for("message", check=check, timeout=60)
            if not msg.channel_mentions:
                return await ctx.error("You must mention a channel.")
            panel_channel = msg.channel_mentions[0]
            await msg.delete()
        except asyncio.TimeoutError:
            return await ctx.error("Setup timed out.")

        # Create or update config
        config, _ = await TicketConfig.get_or_create(
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
            color=cfg.COLOR,
        )
        panel_embed.set_footer(text=cfg.FOOTER)

        view = TicketPanelView()
        panel_msg = await panel_channel.send(embed=panel_embed, view=view)

        config.message_id = panel_msg.id
        await config.save()

        await setup_msg.delete()
        await ctx.success(f"Ticket panel posted in {panel_channel.mention}!")

    @ticket.command(name="config")
    @commands.has_permissions(manage_guild=True)
    async def ticket_config(self, ctx: Context):
        """Show current ticket system configuration."""
        config = await TicketConfig.get_or_none(guild_id=ctx.guild.id)
        if config is None:
            return await ctx.error("No ticket system configured. Run `aticket setup`.")

        category = ctx.guild.get_channel(config.category_id) if config.category_id else None
        log_ch = ctx.guild.get_channel(config.log_channel_id) if config.log_channel_id else None
        role = ctx.guild.get_role(config.support_role_id) if config.support_role_id else None
        panel_ch = ctx.guild.get_channel(config.channel_id)

        embed = discord.Embed(title="🎫 Ticket Configuration", color=ctx.guild_color)
        embed.add_field(name="Panel Channel", value=panel_ch.mention if panel_ch else "Not set", inline=True)
        embed.add_field(name="Category", value=category.mention if category else "Auto", inline=True)
        embed.add_field(name="Support Role", value=role.mention if role else "None", inline=True)
        embed.add_field(name="Log Channel", value=log_ch.mention if log_ch else "None", inline=True)
        embed.add_field(name="Max Tickets/User", value=str(config.max_tickets), inline=True)
        embed.add_field(name="Button Label", value=config.button_label, inline=True)
        await ctx.send(embed=embed)

    @ticket.command(name="close")
    async def ticket_close(self, ctx: Context, *, reason: Optional[str] = None):
        """Close the current ticket."""
        ticket = await Ticket.get_or_none(channel_id=ctx.channel.id)
        if ticket is None:
            return await ctx.error("This is not a ticket channel.")

        ticket.closed_at = datetime.now(tz=timezone.utc)
        ticket.closed_by = ctx.author.id
        if reason:
            ticket.reason = reason
        await ticket.save()

        config = await TicketConfig.get(id=ticket.config_id)

        # Send transcript to log channel
        if config.log_channel_id:
            log_ch = ctx.guild.get_channel(config.log_channel_id)
            if log_ch:
                messages = [msg async for msg in ctx.channel.history(limit=500, oldest_first=True)]
                transcript_lines = []
                for msg in messages:
                    timestamp = msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
                    content = msg.content or "[embed/attachment]"
                    transcript_lines.append(f"[{timestamp}] {msg.author}: {content}")

                text = "\n".join(transcript_lines)
                fp = BytesIO(text.encode("utf-8"))
                file = discord.File(fp, filename=f"transcript-{ctx.channel.name}.txt")

                opener = ctx.guild.get_member(ticket.opener_id) or f"User {ticket.opener_id}"
                embed = discord.Embed(
                    title=f"Ticket Closed — {ctx.channel.name}",
                    description=(
                        f"**Opened by:** {opener}\n"
                        f"**Closed by:** {ctx.author.mention}\n"
                        f"**Reason:** {reason or 'N/A'}"
                    ),
                    color=discord.Color.red(),
                    timestamp=datetime.now(tz=IST),
                )
                await log_ch.send(embed=embed, file=file)

        await ctx.send(
            embed=discord.Embed(
                description=f"🔒 Ticket closed by {ctx.author.mention}. Deleting in 5 seconds…",
                color=discord.Color.red(),
            )
        )
        await asyncio.sleep(5)
        with suppress(discord.HTTPException):
            await ctx.channel.delete(reason=f"Ticket closed by {ctx.author}")

    @ticket.command(name="add")
    async def ticket_add(self, ctx: Context, user: discord.Member):
        """Add a user to the current ticket."""
        ticket = await Ticket.get_or_none(channel_id=ctx.channel.id)
        if ticket is None:
            return await ctx.error("This is not a ticket channel.")

        await ctx.channel.set_permissions(
            user, view_channel=True, send_messages=True, read_message_history=True
        )
        await ctx.success(f"Added {user.mention} to this ticket.")

    @ticket.command(name="remove")
    async def ticket_remove(self, ctx: Context, user: discord.Member):
        """Remove a user from the current ticket."""
        ticket = await Ticket.get_or_none(channel_id=ctx.channel.id)
        if ticket is None:
            return await ctx.error("This is not a ticket channel.")

        await ctx.channel.set_permissions(user, overwrite=None)
        await ctx.success(f"Removed {user.mention} from this ticket.")


async def setup(bot) -> None:
    await bot.add_cog(TicketSystem(bot))
