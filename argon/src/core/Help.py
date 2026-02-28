from __future__ import annotations

from difflib import get_close_matches
from contextlib import suppress
from typing import List, Mapping

import discord
from discord.ext import commands

import config
from models import Guild
from utils import LinkButton, LinkType, ArgonPaginator, discord_timestamp, truncate_string, emote

from .Cog import Cog



import discord
from discord.ext import commands

import config
from models import Guild
from utils import LinkButton, LinkType, ArgonPaginator, discord_timestamp, truncate_string, emote

from .Cog import Cog


class HelpSelect(discord.ui.Select):
    def __init__(self, mapping, ctx):
        self.mapping = mapping
        self.ctx = ctx
        
        # Parse emojis
        check_emoji = discord.PartialEmoji.from_str(emote.check)
        arrow_emoji = discord.PartialEmoji.from_str(emote.arrow)
        
        options = [
            discord.SelectOption(
                label="Main Menu",
                description="Return to the main help menu",
                emoji=check_emoji,
                value="main"
            )
        ]
        
        # Filter and sort cogs
        hidden = ("HelpCog", "Dev", "NoPrefixCmd", "ArgonAlerts", "Jishaku", "Bug Reporting")
        sorted_cogs = sorted(mapping.items(), key=lambda x: x[0].qualified_name if x[0] else "")
        
        for cog, cmds in sorted_cogs:
            if cog and cog.qualified_name not in hidden and cmds:
                options.append(discord.SelectOption(
                    label=cog.qualified_name.title(),
                    description=f"View commands for {cog.qualified_name}",
                    emoji=arrow_emoji,
                    value=cog.qualified_name
                ))

        super().__init__(placeholder="Select a module...", min_values=1, max_values=1, options=options[:25])

    async def callback(self, interaction: discord.Interaction):
        if interaction.user.id != self.ctx.author.id:
            return await interaction.response.send_message("This menu is not for you.", ephemeral=True)

        value = self.values[0]
        
        if value == "main":
            # Reconstruct main menu
            embed = await self.view.get_main_embed()
            await interaction.response.edit_message(embed=embed, view=self.view)
        else:
            # Find selected cog
            selected_cog = None
            for cog, _ in self.mapping.items():
                if cog and cog.qualified_name == value:
                    selected_cog = cog
                    break
            
            if selected_cog:
                # Create cog embed using existing logic or new design
                desc = selected_cog.description + "\n\n" if selected_cog.description else ""
                embed = discord.Embed(
                    title=f"{emote.arrow} **__{selected_cog.qualified_name.title()}__**",
                    description=desc,
                    color=self.ctx.guild_color
                )
                
                cmds_text = ""
                for cmd in selected_cog.get_commands():
                    if not cmd.hidden:
                        cmds_text += f"`{cmd.qualified_name}`\n"
                
                embed.add_field(name="**__Commands__**", value=cmds_text or "No commands found.", inline=False)
                embed.set_footer(text=f"Requested by {self.ctx.author}", icon_url=self.ctx.author.display_avatar.url)
                
                await interaction.response.edit_message(embed=embed, view=self.view)


class HelpView(discord.ui.View):
    def __init__(self, mapping, ctx):
        super().__init__(timeout=120)
        self.ctx = ctx
        self.mapping = mapping
        self.add_item(HelpSelect(mapping, ctx))
        
        # Add link buttons
        self.add_item(discord.ui.Button(label="Support Server", url=config.SERVER_LINK, style=discord.ButtonStyle.link))
        self.add_item(discord.ui.Button(label="Invite Me", url=config.BOT_INVITE, style=discord.ButtonStyle.link))

    @discord.ui.button(label="List View", style=discord.ButtonStyle.primary, custom_id="list_all", row=2)
    async def list_all(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id != self.ctx.author.id:
            return await interaction.response.send_message("This menu is not for you.", ephemeral=True)

        if button.label == "List View":
            embed = await self.get_all_commands_embed()
            button.label = "Main Menu"
            await interaction.response.edit_message(embed=embed, view=self)
        else:
            embed = await self.get_main_embed()
            button.label = "List View"
            await interaction.response.edit_message(embed=embed, view=self)

    def __init__(self, mapping, ctx):
        super().__init__(timeout=120)
        self.ctx = ctx
        self.mapping = mapping
        
        # Select Menu (Row 0 by default, but nice to be explicit if we use rows elsewhere)
        self.add_item(HelpSelect(mapping, ctx))
        
        # Link Buttons (Row 1)
        self.add_item(discord.ui.Button(label="Support Server", url=config.SERVER_LINK, style=discord.ButtonStyle.link, row=1))
        self.add_item(discord.ui.Button(label="Invite Me", url=config.BOT_INVITE, style=discord.ButtonStyle.link, row=1))
        self.add_item(discord.ui.Button(label="Website", url=config.WEBSITE, style=discord.ButtonStyle.link, row=1))

    async def get_all_commands_embed(self):
        ctx = self.ctx
        embed = discord.Embed(
            title=f"{emote.check} **__All Modules & Commands__**",
            color=ctx.guild_color
        )
        
        hidden = ("HelpCog", "Dev", "NoPrefixCmd", "ArgonAlerts", "Jishaku", "Bug Reporting")
        sorted_cogs = sorted(self.mapping.items(), key=lambda x: x[0].qualified_name if x[0] else "")
        
        for cog, cmds in sorted_cogs:
            if cog and cog.qualified_name not in hidden and cmds:
                cmds_text = ", ".join(f"`{c.qualified_name}`" for c in cmds if not c.hidden)
                if cmds_text:
                    embed.add_field(name=cog.qualified_name.title(), value=cmds_text, inline=False)
        
        embed.set_footer(text=f"Requested by {ctx.author}", icon_url=ctx.author.display_avatar.url)
        return embed

    async def get_main_embed(self):
        ctx = self.ctx
        is_premium_bool = await ctx.is_premium_guild()
        is_premium = "Yes" if is_premium_bool else "No"
        
        embed = discord.Embed(
            title=f"{emote.check} **__Help Menu__**",
            description="",
            color=ctx.guild_color
        )
        
        # Basic Info
        prefix = ctx.bot.cache.guild_data[ctx.guild.id].get("prefix", config.PREFIX)
        embed.description += (
            f"{emote.arrow} **__Basic Info__**\n"
            f"**Prefix:** `{prefix}`\n"
            f"**Premium:** `{is_premium}`\n\n"
        )
        
        # Modules List
        embed.description += f"{emote.arrow} **__Modules__**\n"
        hidden = ("HelpCog", "Dev", "NoPrefixCmd", "ArgonAlerts", "Jishaku", "Bug Reporting")
        sorted_cogs = sorted(self.mapping.items(), key=lambda x: x[0].qualified_name if x[0] else "")
        
        module_list = []
        for cog, cmds in sorted_cogs:
            if cog:
                with open("help_debug.log", "a", encoding="utf-8") as f:
                    f.write(f"Cog={cog.qualified_name} Hidden={cog.qualified_name in hidden} Cmds={len(cmds)}\n")
                    for c in cmds:
                        f.write(f"  - {c.name} (Hidden: {c.hidden})\n")
            if cog and cog.qualified_name not in hidden and cmds:
                module_list.append(f"{emote.arrow} **{cog.qualified_name.title()}**")
        
        embed.description += "\n".join(module_list) + "\n\n"
        
        # Links
        embed.description += f"{emote.arrow} **__Links__**\n"
        embed.description += f"[**__Support Server__**]({config.SERVER_LINK}) | [**__Invite Me__**]({config.BOT_INVITE}) | [**__Website__**]({config.WEBSITE})"
        
        embed.set_footer(text=f"Requested by {ctx.author}", icon_url=ctx.author.display_avatar.url)
        return embed


class HelpCommand(commands.HelpCommand):
    def __init__(self) -> None:
        super().__init__(
            verify_checks=False,
            command_attrs={
                "cooldown": commands.CooldownMapping.from_cooldown(1, 8.0, commands.BucketType.member),
                "help": "Shows help about the bot, a command, or a category",
            },
        )

    @property
    def color(self):
        return self.context.guild_color

    async def send_bot_help(self, mapping: Mapping[Cog, List[commands.Command]]):
        ctx = self.context
        
        view = HelpView(mapping, ctx)
        embed = await view.get_main_embed()
        
        view.message = await ctx.send(embed=embed, view=view)

    async def send_group_help(self, group: commands.Group):
        # ... (Keep existing group help or adapt similarly if requested, sticking to existing logic for now)
        prefix = self.context.prefix

        if not group.commands:
            return await self.send_command_help(group)

        embed = discord.Embed(color=discord.Color(self.color))

        embed.title = f"{group.qualified_name} {group.signature}"
        _help = group.help or "No description provided..."

        _cmds = "\n".join(f"`{prefix}{c.qualified_name}` : {truncate_string(c.short_doc,60)}" for c in group.commands)

        embed.description = f"> {_help}\n\n**Subcommands**\n{_cmds}"

        embed.set_footer(text=f'Use "{prefix}help <command>" for more information.')

        if group.aliases:
            embed.add_field(
                name="Aliases",
                value=", ".join(f"`{aliases}`" for aliases in group.aliases),
                inline=False,
            )

        examples = []
        if group.extras:
            if _gif := group.extras.get("gif"):
                embed.set_image(url=_gif)

            if _ex := group.extras.get("examples"):
                examples = [f"{self.context.prefix}{i}" for i in _ex]

        if examples:
            examples: str = "\n".join(examples)  # type: ignore
            embed.add_field(name="Examples", value=f"```{examples}```")

        await self.context.send(embed=embed, embed_perms=True)

    async def send_cog_help(self, cog: Cog):
        # Adapting to new style if directly invoked
        embed = discord.Embed(
            title=f"{emote.arrow} **__{cog.qualified_name.title()}__**",
            description=f"{cog.description or 'No description provided.'}\n\n",
            color=self.context.guild_color
        )
        
        cmds_text = ""
        for cmd in cog.get_commands():
             if not cmd.hidden:
                  cmds_text += f"`{cmd.qualified_name}`\n"
        
        embed.add_field(name="**__Commands__**", value=cmds_text or "No commands found.", inline=False)
        embed.set_footer(text=f"Requested by {self.context.author}", icon_url=self.context.author.display_avatar.url)
        await self.context.send(embed=embed)

    async def send_command_help(self, cmd: commands.Command):
        embed = discord.Embed(color=self.color)
        embed.title = "Command: " + cmd.qualified_name

        examples = []

        alias = ",".join((f"`{alias}`" for alias in cmd.aliases)) if cmd.aliases else "No aliases"
        _text = (
            f"**Description:** {cmd.help or 'No help found...'}\n"
            f"**Usage:** `{self.get_command_signature(cmd)}`\n"
            f"**Aliases:** {alias}\n"
            f"**Examples:**"
        )

        if cmd.extras:
            if _gif := cmd.extras.get("gif"):
                embed.set_image(url=_gif)

            if _ex := cmd.extras.get("examples"):
                examples = [f"{self.context.prefix}{i}" for i in _ex]

        examples: str = "\n".join(examples) if examples else "Command has no examples"  # type: ignore

        _text += f"```{examples}```"

        embed.description = _text

        await self.context.send(embed=embed, embed_perms=True)

    async def command_not_found(self, string: str):
        message = f"Could not find the `{string}` command. "
        commands_list = (str(cmd) for cmd in self.context.bot.walk_commands())

        if dym := "\n".join(get_close_matches(string, commands_list)):
            message += f"Did you mean...\n{dym}"

        return message
