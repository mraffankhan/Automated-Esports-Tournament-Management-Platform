import discord
from discord.ext import commands
from core import Cog, Context
from models import WelcomeConfig
from contextlib import suppress

class Welcome(Cog):
    def __init__(self, bot):
        self.bot = bot

    @Cog.listener()
    async def on_member_join(self, member: discord.Member):
        guild = member.guild
        config = await WelcomeConfig.get_or_none(guild_id=guild.id)
        
        if not config or not config.enabled or not config.channel_id:
            return

        channel = guild.get_channel(config.channel_id)
        if not channel:
            return

        content = config.format_message(member)
        
        try:
            if config.embed_enabled:
                embed = discord.Embed(
                    title=config.embed_title or "Welcome!",
                    description=content,
                    color=config.embed_color or self.bot.color
                )
                await channel.send(embed=embed)
            else:
                await channel.send(content)
        except (discord.Forbidden, discord.HTTPException):
            pass

    @commands.group(invoke_without_command=True)
    @commands.has_permissions(manage_guild=True)
    async def welcome(self, ctx: Context):
        """Manage welcome messages for the server."""
        await ctx.send_help(ctx.command)

    @welcome.command(name="channel")
    @commands.has_permissions(manage_guild=True)
    async def welcome_channel(self, ctx: Context, channel: discord.TextChannel):
        """Set the channel for welcome messages."""
        config, _ = await WelcomeConfig.get_or_create(guild_id=ctx.guild.id)
        config.channel_id = channel.id
        await config.save()
        await ctx.success(f"Welcome messages will now be sent to {channel.mention}.")

    @welcome.command(name="message")
    @commands.has_permissions(manage_guild=True)
    async def welcome_message(self, ctx: Context, *, text: str):
        """
        Set the welcome message.
        Variables: {user}, {username}, {server}, {member_count}
        """
        config, _ = await WelcomeConfig.get_or_create(guild_id=ctx.guild.id)
        config.message = text
        await config.save()
        await ctx.success("Welcome message has been updated.")

    @welcome.command(name="toggle")
    @commands.has_permissions(manage_guild=True)
    async def welcome_toggle(self, ctx: Context):
        """Toggle welcome messages on or off."""
        config, _ = await WelcomeConfig.get_or_create(guild_id=ctx.guild.id)
        config.enabled = not config.enabled
        await config.save()
        status = "enabled" if config.enabled else "disabled"
        await ctx.success(f"Welcome messages have been **{status}**.")

    @welcome.command(name="embed")
    @commands.has_permissions(manage_guild=True)
    async def welcome_embed(self, ctx: Context):
        """Toggle whether to send the welcome message in an embed."""
        config, _ = await WelcomeConfig.get_or_create(guild_id=ctx.guild.id)
        config.embed_enabled = not config.embed_enabled
        await config.save()
        status = "enabled" if config.embed_enabled else "disabled"
        await ctx.success(f"Welcome message embed mode has been **{status}**.")

    @welcome.command(name="test")
    @commands.has_permissions(manage_guild=True)
    async def welcome_test(self, ctx: Context):
        """Send a test welcome message."""
        config = await WelcomeConfig.get_or_none(guild_id=ctx.guild.id)
        if not config:
            return await ctx.error("Welcome messages are not configured for this server.")
        
        if not config.channel_id:
            return await ctx.error("No welcome channel has been set.")

        channel = ctx.guild.get_channel(config.channel_id)
        if not channel:
            return await ctx.error("The configured welcome channel could not be found.")

        content = config.format_message(ctx.author)
        
        if config.embed_enabled:
            embed = discord.Embed(
                title=config.embed_title or "Welcome!",
                description=content,
                color=config.embed_color or self.bot.color
            )
            await channel.send("This is a test welcome message:", embed=embed)
        else:
            await channel.send(f"This is a test welcome message:\n\n{content}")
        
        await ctx.success("Test message sent!")

    @welcome.command(name="config", aliases=["show", "settings"])
    @commands.has_permissions(manage_guild=True)
    async def welcome_config(self, ctx: Context):
        """Show the current welcome message configuration."""
        config = await WelcomeConfig.get_or_none(guild_id=ctx.guild.id)
        if not config:
            return await ctx.send("Welcome messages are not configured for this server.")

        status = "Enabled" if config.enabled else "Disabled"
        embed_status = "Yes" if config.embed_enabled else "No"
        channel = ctx.guild.get_channel(config.channel_id)
        channel_name = channel.mention if channel else "None"

        embed = discord.Embed(
            title="Welcome Configuration",
            color=self.bot.color,
            description=f"**Status:** {status}\n**Channel:** {channel_name}\n**Embed:** {embed_status}"
        )
        embed.add_field(name="Message", value=f"```\n{config.message}\n```", inline=False)
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(Welcome(bot))
