from discord.ext import commands
from discord.ext.commands import Converter

from models import *
from utils import ArgonMember


class EasyMemberConverter(Converter):
    async def convert(self, ctx, argument: str):
        try:
            member = await ArgonMember().convert(ctx, argument)
            return getattr(member, "mention")
        except commands.MemberNotFound:
            return "Invalid Member!"
