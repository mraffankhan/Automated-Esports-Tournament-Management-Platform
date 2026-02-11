from discord.ext import commands


class PotatoError(commands.CheckFailure):
    pass


class NotSetup(PotatoError):
    def __init__(self):
        super().__init__(
            "This command requires you to have Potato's private channel.\nKindly run `{ctx.prefix}setup` and try again."
        )


class NotPremiumGuild(PotatoError):
    def __init__(self):
        super().__init__(
            "This command requires this server to be premium.\n\nCheckout Potato Premium [here]({ctx.bot.prime_link})"
        )


class NotPremiumUser(PotatoError):
    def __init__(self):
        super().__init__(
            "This command requires you to be a premium user.\nCheckout Potato Premium [here]({ctx.bot.prime_link})"
        )


class InputError(PotatoError):
    pass


class SMNotUsable(PotatoError):
    def __init__(self):
        super().__init__("You need either the `scrims-mod` role or `Manage Server` permissions to use this command.")


class TMNotUsable(PotatoError):
    def __init__(self):
        super().__init__("You need either the `tourney-mod` role or `Manage Server` permissions to use tourney manager.")


class PastTime(PotatoError):
    def __init__(self):
        super().__init__(
            f"The time you entered seems to be in past.\n\nKindly try again, use times like: `tomorrow` , `friday 9pm`"
        )


TimeInPast = PastTime


class InvalidTime(PotatoError):
    def __init__(self):
        super().__init__(f"The time you entered seems to be invalid.\n\nKindly try again.")
