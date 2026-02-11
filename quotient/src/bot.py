import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Starting bot...", flush=True)
    import config
    from core import bot
    print("Imported bot, running...", flush=True)
    bot.run(config.DISCORD_TOKEN)
