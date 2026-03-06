import discord
from discord.ext import commands
import datetime

class AntiNuke(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.support_server_id = 859292908304859156 # from config.SERVER_ID
        self.whitelist_role_ids = [1475359872139923486, 1475360625663148155] # wl roles

    async def punish(self, guild: discord.Guild, user_id: int, reason: str):
        member = guild.get_member(user_id)
        if not member:
            # If they already left, we can just ban them by ID if resolving fails.
            # But let's assume if they aren't in guild, they aren't whitelisted.
            try:
                await guild.ban(discord.Object(id=user_id), reason=f"ZERO TOLERANCE Anti-Nuke Triggered: {reason}")
            except: pass
            return True
            
        # Can't punish owner or bot itself
        if member.id == guild.owner_id or member.id == self.bot.user.id:
            return False
            
        # Can't punish someone with higher role
        if member.top_role >= guild.me.top_role:
            return False

        # Can't punish someone with whitelist role
        if any(member.get_role(role_id) for role_id in self.whitelist_role_ids):
            return False

        try:
            # DIRECT BAN (Zero Tolerance)
            await member.ban(reason=f"ZERO TOLERANCE Anti-Nuke Triggered: {reason}")
        except discord.Forbidden:
            pass # We failed to ban (hierarchy issue). Cannot do anything else.
            
        return True # Handled as a punishment

    async def _handle_audit_event(self, guild: discord.Guild, action: discord.AuditLogAction, target_id: int, reason: str, time_limit: int = 5):
        if guild.id != self.support_server_id: return False
        
        async for entry in guild.audit_logs(limit=1, action=action):
            if entry.target.id == target_id:
                if (discord.utils.utcnow() - entry.created_at).total_seconds() < time_limit:
                    return await self.punish(guild, entry.user.id, reason)
                break
        return False

    # --- Deletions ---
    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel: discord.abc.GuildChannel):
        await self._handle_audit_event(channel.guild, discord.AuditLogAction.channel_delete, channel.id, "Channel Deletion")

    @commands.Cog.listener()
    async def on_guild_role_delete(self, role: discord.Role):
        await self._handle_audit_event(role.guild, discord.AuditLogAction.role_delete, role.id, "Role Deletion")

    # --- Creations ---
    @commands.Cog.listener()
    async def on_guild_channel_create(self, channel: discord.abc.GuildChannel):
        was_punished = await self._handle_audit_event(channel.guild, discord.AuditLogAction.channel_create, channel.id, "Channel Creation")
        if was_punished:
            try:
                await channel.delete(reason="Anti-Nuke Recovery: Unauthorized Channel Creation")
            except: pass

    @commands.Cog.listener()
    async def on_guild_role_create(self, role: discord.Role):
        was_punished = await self._handle_audit_event(role.guild, discord.AuditLogAction.role_create, role.id, "Role Creation")
        if was_punished:
            try:
                await role.delete(reason="Anti-Nuke Recovery: Unauthorized Role Creation")
            except: pass

    # --- Webhooks ---
    @commands.Cog.listener()
    async def on_webhooks_update(self, channel: discord.abc.GuildChannel):
        if channel.guild.id != self.support_server_id: return
        # Since webhook updates don't easily give us the target ID in the same way, we just look for recent webhook creations/deletions/updates
        async for entry in channel.guild.audit_logs(limit=1):
            if entry.action in [discord.AuditLogAction.webhook_create, discord.AuditLogAction.webhook_update, discord.AuditLogAction.webhook_delete]:
                if (discord.utils.utcnow() - entry.created_at).total_seconds() < 5:
                    await self.punish(channel.guild, entry.user.id, "Webhook Modification")
                break

    # --- Bans/Kicks ---
    @commands.Cog.listener()
    async def on_member_ban(self, guild: discord.Guild, user: discord.User):
        await self._handle_audit_event(guild, discord.AuditLogAction.ban, user.id, "Unauthorized Ban")

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        await self._handle_audit_event(member.guild, discord.AuditLogAction.kick, member.id, "Unauthorized Kick")

    # --- Server Updates (Name change, Vanity URL, etc) ---
    @commands.Cog.listener()
    async def on_guild_update(self, before: discord.Guild, after: discord.Guild):
        if after.id != self.support_server_id: return
        
        async for entry in after.audit_logs(limit=1, action=discord.AuditLogAction.guild_update):
            if (discord.utils.utcnow() - entry.created_at).total_seconds() < 5:
                await self.punish(after, entry.user.id, "Server Modification")
            break

async def setup(bot):
    await bot.add_cog(AntiNuke(bot))
