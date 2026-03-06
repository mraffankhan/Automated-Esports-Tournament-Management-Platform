import asyncio
import os
import sys

# add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'argon', 'src'))

from tortoise import Tortoise

async def main():
    try:
        await Tortoise.init(
            db_url="mysql://root:root@localhost:3306/argon", # Let's fetch from config later
            modules={'models': ['models']}
        )
    except Exception as e:
        print(f"Error initializing DB: {e}")
        # Could not connect, let's just print config
        from core.config import Config
        cfg = Config()
        print(f"DB URL: {cfg.DATABASE_URL}")
        await Tortoise.init(
            db_url=cfg.DATABASE_URL,
            modules={'models': ['models']}
        )
        print("Connected!")

    from models.esports.tourney import Tourney

    t = Tourney(
        guild_id=123,
        host_id=123,
        name="Test",
        registration_channel_id=123,
        confirm_channel_id=123,
        role_id=123,
        total_slots=10,
        group_size=2
    )
    
    try:
        await t.save()
        print("Saved successfully!")
    except Exception as e:
        print(f"Error saving: {e}")
        import traceback
        traceback.print_exc()

    await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(main())
