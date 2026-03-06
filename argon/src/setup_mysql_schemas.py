import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncio
from tortoise import Tortoise

import config

async def prepare_mysql_tables():
    print("Connecting to New MySQL Database (Ender Cloud) using Tortoise...")
    # Initialize tortoise so models are available and we can build tables
    
    if not Tortoise.apps.get("models"):
        print("Initializing models module...")
        import models as db_models
        
    await Tortoise.init(config.TORTOISE)
    
    print("Generating Schemas in MySQL...")
    await Tortoise.generate_schemas(safe=True)
    
    models = Tortoise.apps.get("models", {})
    print(f"Successfully prepared schemas for {len(models)} models.")
    
    await Tortoise.close_connections()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(prepare_mysql_tables())
