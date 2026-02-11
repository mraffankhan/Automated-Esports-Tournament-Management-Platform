from typing import List

import discord

import config
from models import PremiumPlan, PremiumTxn
from utils import emote


class PlanSelector(discord.ui.Select):
    def __init__(self, plans: List[PremiumPlan]):
        super().__init__(placeholder="Select a Potato Premium Plan... ")

        for _ in plans:
            self.add_option(label=f"{_.name} - ₹{_.price}", description=_.description, value=_.id)

    async def callback(self, interaction: discord.Interaction):
        await interaction.response.defer()
        self.view.plan = self.values[0]
        self.view.stop()


class PremiumPurchaseBtn(discord.ui.Button):
    def __init__(self, label="Get Potato Premium", emoji=emote.diamond, style=discord.ButtonStyle.link, url=config.SERVER_LINK):
        super().__init__(style=style, label=label, emoji=emoji, url=url)

    async def callback(self, interaction: discord.Interaction):
        pass


class PremiumView(discord.ui.View):
    def __init__(self, text="This feature requires Potato Premium.", *, label="Get Potato Premium"):
        super().__init__(timeout=None)
        self.text = text
        self.add_item(PremiumPurchaseBtn(label=label))

    @property
    def premium_embed(self) -> discord.Embed:
        _e = discord.Embed(
            color=0x00FFB3, description=f"**You discovered a premium feature <a:premium:807911675981201459>**"
        )
        _e.description = (
            f"\n*`{self.text}`*\n\n"
            "__Perks you get with Potato Premium:__\n"
            f"{emote.check} Access to `Potato Premium` bot.\n"
            f"{emote.check} Unlimited Scrims.\n"
            f"{emote.check} Unlimited Tournaments.\n"
            f"{emote.check} Custom Reactions for Regs.\n"
            f"{emote.check} Smart SSverification.\n"
            f"{emote.check} Cancel-Claim Panel.\n"
            f"{emote.check} Premium Role + more...\n"
        )
        return _e
