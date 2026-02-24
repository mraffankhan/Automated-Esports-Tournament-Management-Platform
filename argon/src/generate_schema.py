import sys
import os
# Ensure src is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncio
from tortoise import Tortoise
import config
import logging

# Configure logging to capture SQL statements
logger = logging.getLogger("tortoise.db_client")
logger.setLevel(logging.INFO) # DEBUG might be too much, INFO should show queries? 
# Actually Tortoise logs queries at DEBUG level.
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler(sys.stdout)
# handler = logging.FileHandler("schema.log", mode='w')
logger.addHandler(handler)

async def main():
    print("Pre-importing models to check for errors...")
    try:
        import models
        print(f"Models imported successfully: {models}")
    except ImportError as e:
        print(f"ImportError importing models: {e}")
        return
    except Exception as e:
        print(f"Exception importing models: {e}")
        import traceback
        traceback.print_exc()
        return

    print("Initializing Tortoise...")
    # Create custom SSL context to bypass verification
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    # Custom config overriding the file config to inject SSL context
    custom_config = config.TORTOISE.copy()
    # We need to replace the URL connection with explicit credentials dict to pass ssl object
    # Or rely on Tortoise parsing?
    # Tortoise doesn't support passing SSL context via URL string.
    # So we must use the dict format for 'default' connection.
    
    custom_config["connections"] = {
        "default": {
            "engine": "tortoise.backends.asyncpg",
            "credentials": {
                "database": "postgres",
                "host": "db.pzsvbqfzacidkeqavgfh.supabase.co",
                "password": "affan@805032",
                "port": 5432,
                "user": "postgres",
                "ssl": ctx
            }
        }
    }

    try:
        await Tortoise.init(custom_config)
        print("Connected to DB.")
        
        print("--- BEGIN SQL SCHEMA ---")
        # generate_schemas executes the SQL. 
        # With debug logging, we should see the CREATE TABLE statements.
        await Tortoise.generate_schemas(safe=True) 
        print("--- END SQL SCHEMA ---")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await Tortoise.close_connections()

if __name__ == "__main__":
    # Windows SelectorEventLoopPolicy fix if needed
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
