from tortoise import fields, models


class WelcomeConfig(models.Model):
    class Meta:
        table = "welcome_configs"

    guild_id = fields.BigIntField(pk=True, index=True)
    channel_id = fields.BigIntField(null=True)
    message = fields.TextField(
        default="Welcome {user} to **{server}**! You are member #{member_count}."
    )
    enabled = fields.BooleanField(default=False)
    embed_enabled = fields.BooleanField(default=False)
    embed_color = fields.IntField(default=65459, null=True)
    embed_title = fields.TextField(default="Welcome!", null=True)

    def format_message(self, member) -> str:
        """Format the welcome message with member/server variables."""
        return self.message.replace(
            "{user}", member.mention
        ).replace(
            "{username}", str(member)
        ).replace(
            "{server}", member.guild.name
        ).replace(
            "{member_count}", str(member.guild.member_count)
        )
