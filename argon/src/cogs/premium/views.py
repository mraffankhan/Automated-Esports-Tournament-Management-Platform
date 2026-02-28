from typing import List

import discord

import config
from models import Guild, PremiumPlan, PremiumTxn
from utils import emote


class PlanSelector(discord.ui.Select):
    def __init__(self, plans: List[PremiumPlan]):
        super().__init__(placeholder="Select a Argon Premium Plan... ")

        for _ in plans:
            self.add_option(label=f"{_.name} - ₹{_.price}", description=_.description, value=_.id)

    async def callback(self, interaction: discord.Interaction):
        await interaction.response.defer()
        self.view.plan = self.values[0]
        self.view.stop()


class PremiumPurchaseBtn(discord.ui.Button):
    def __init__(self, label="Get ARGON Pro", emoji=emote.diamond, style=discord.ButtonStyle.blurple):
        super().__init__(style=style, label=label, emoji=emoji, custom_id="premium:purchase")

    async def callback(self, interaction: discord.Interaction):
        # Dynamically fetch if the server is premium to display the prompt required
        guild_data = await Guild.get_or_none(guild_id=interaction.guild_id)
        if guild_data and guild_data.is_premium:
            return await interaction.response.send_message(
                f"Server **{interaction.guild.name}** already has **ARGON PREMIUM** activated!", 
                ephemeral=True
            )
        
        # Fallback for some reason if it isn't
        await interaction.response.send_message("Please visit our support server to upgrade manually.", ephemeral=True)


class PremiumView(discord.ui.View):
    def __init__(self, color, text="This feature requires Argon Premium.", *, label="Get Argon Premium"):
        super().__init__(timeout=None)
        self.text = text
        self.color = color
        self.add_item(PremiumPurchaseBtn(label=label))

    @property
    def premium_embed(self) -> discord.Embed:
        _e = discord.Embed(
            color=self.color, description=f"**You discovered a premium feature <a:premium:807911675981201459>**"
        )
        _e.description = (
            f"\n*`{self.text}`*\n\n"
            "__Perks you get with Argon Premium:__\n"
            f"{emote.check} Access to `Argon Premium` bot.\n"
            f"{emote.check} Unlimited Scrims.\n"
            f"{emote.check} Unlimited Tournaments.\n"
            f"{emote.check} Custom Reactions for Regs.\n"
            f"{emote.check} Smart SSverification.\n"
            f"{emote.check} Cancel-Claim Panel.\n"
            f"{emote.check} Premium Role + more...\n"
            f"<:argon_book:1477253615046623356> Premium is entirely free.\n"
        )
        return _e
