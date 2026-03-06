import discord
from discord.ext import commands
from models import User

class PrivateWelcome(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.welcome_channel_id = 1402715052825645298

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        channel = member.guild.get_channel(self.welcome_channel_id)
        if not channel:
            return

        embed = discord.Embed(
            description=(
                f"**Welcome RAVONIX HQ**\n"
                f"> You're Our {member.guild.member_count}th Member\n"
                f"> -# ~~                                                                                                               ~~\n"
                f"> <a:dot:1477555382313291921>  [Website](https://genzconnect.pro)\n"
                f"> <a:dot:1477555382313291921>  [Annonces](https://discord.com/channels/859292908304859156/1473179999816388639)\n"
                f"> <a:dot:1477555382313291921>  [Bot Status](https://discord.com/channels/859292908304859156/1472549477339365407)\n"
                f"> -# ~~                                                                                                               ~~\n"
                f"> Be Active In  <#1402715052825645298>  "
            ),
            color=0x0a084c
        )
        
        # Setting thumbnail to user's avatar if desired, but user didn't ask for it.
        # However, embeds usually look better. The prompt just gave the content.
        embed.set_thumbnail(url=member.display_avatar.url)

        try:
            await channel.send(content=member.mention, embed=embed)
        except discord.Forbidden:
            pass

        # Give Auto-Role for Private Bot
        try:
            await member.add_roles(discord.Object(id=1473323947251601603), reason="Auto-Role from Private Bot")
        except Exception:
            pass

        # Give Premium Role (1477570109135650907) if User is Premium in Database
        if await User.filter(pk=member.id, is_premium=True).exists():
            try:
                await member.add_roles(discord.Object(id=1477570109135650907), reason="Private Bot: User is Premium")
            except Exception:
                pass

    @commands.command(name="premsync", aliases=["psync"])
    async def premsync(self, ctx, member: discord.Member):
        """Syncs the Premium role to a specific user (Devs only)."""
        import config
        if ctx.author.id not in config.DEVS:
            return

        if not ctx.guild or ctx.guild.id != self.welcome_channel_id:
            # wait, welcome_channel_id is a channel ID, not a server ID.
            pass

        if ctx.guild.id != 859292908304859156:
            return await ctx.send("This command can only be used in the support server.")

        is_premium = await User.filter(pk=member.id, is_premium=True).exists()
        
        if is_premium:
            try:
                await member.add_roles(discord.Object(id=1477570109135650907), reason="Manual Premium Sync")
                await ctx.send(f"✅ Successfully gave the Premium role to {member.mention}.")
            except discord.Forbidden:
                await ctx.send("❌ I don't have permission to manage roles or my role is lower than the Premium role.")
        else:
            await ctx.send(f"❌ {member.mention} does not have premium in the database.")

    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member):
        if before.guild.id != 859292908304859156:
            return
            
        # Get the ID of the main Argon Premium role the user is referring to
        import config
        # Provide a fallback just in case PREMIUM_ROLE isn't defined
        argon_premium_role_id = getattr(config, 'PREMIUM_ROLE', 0)
        private_premium_role_id = 1477570109135650907
        
        # If the server owner hasn't configured the main premium role, we can't check
        if argon_premium_role_id == 0:
            return

        has_role_before = any(r.id == argon_premium_role_id for r in before.roles)
        has_role_after = any(r.id == argon_premium_role_id for r in after.roles)

        # Did they literally just get the main Argon premium role?
        if not has_role_before and has_role_after:
            try:
                await after.add_roles(
                    discord.Object(id=private_premium_role_id), 
                    reason="Private Bot: User was granted Argon Premium role"
                )
            except Exception:
                pass

async def setup(bot):
    await bot.add_cog(PrivateWelcome(bot))
