import discord
from discord.ext import commands
import config

class PrivateHelp(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.group(name="phelp", invoke_without_command=True)
    async def phelp(self, ctx):
        """Help command for the private bot (Devs only)"""
        # Ensure only devs can use this command
        if ctx.author.id not in config.DEVS:
            return

        embed = discord.Embed(
            title="Private Bot Help Panel (Developer Only)",
            description="Prefix: `a` (or custom prefix)\n\nHere are the available modules for the private bot:",
            color=0x0a084c
        )

        embed.add_field(
            name="🛡️ Anti-Nuke (Auto-Active)",
            value="Watches for mass bans, kicks, channel deletions, and role deletions. Punishes offenders automatically."
                  "\n`No commands needed. Runs automatically.`",
            inline=False
        )
        
        embed.add_field(
            name="👋 Private Welcome (Auto-Active)",
            value="Sends the custom RAVONIX HQ welcome embed to channel `<#1402715052825645298>`."
                  "\n`No commands needed. Runs automatically.`",
            inline=False
        )

        embed.add_field(
            name="🛠️ Moderation (Configured)",
            value="Standard moderation commands from the main bot are available.\nUse `ahelp mod` or similar if the standard help command is loaded.",
            inline=False
        )

        embed.set_footer(text="RAVONIX HQ Private Bot")

        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(PrivateHelp(bot))
