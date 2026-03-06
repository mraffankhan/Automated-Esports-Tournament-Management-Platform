import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Starting private bot...", flush=True)
    import config
    
    # Override extensions dynamically for the private bot process
    config.EXTENSIONS = config.PRIVATE_BOT_EXTENSIONS

    from core import bot
    # Disable default help for the private bot to prevent conflicts
    # Or just rely on the existing one being overridden appropriately
    # We will just disable the default one for the private bot
    bot.help_command = None

    print("Imported private bot, running...", flush=True)
    bot.run(config.PRIVATE_BOT_TOKEN)
