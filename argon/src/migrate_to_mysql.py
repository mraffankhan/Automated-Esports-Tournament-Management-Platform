import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncio
import psycopg2
from psycopg2.extras import RealDictCursor

# 1. Old Supabase Connection String
OLD_DB_URL = "postgres://postgres:affan@805032@49.44.79.236:5432/postgres"

# 2. We import our config which has ALREADY been updated to MySQL in config.py
import config

def fetch_postgres_data(conn, table_name):
    print(f"Fetching data from postgres table: {table_name}")
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f'SELECT * FROM "{table_name}"')
            records = cur.fetchall()
            return [dict(record) for record in records]
    except Exception as e:
        print(f"Error fetching {table_name}: {e}")
        # Rollback the transaction block if a table is missing
        conn.rollback()
        return []

async def migrate_data():
    print("Connecting to Old PostgreSQL Database (Supabase)...")
    
    # Use psycopg2 to connect, using standard connection string or kwargs
    pg_conn = psycopg2.connect(
        host="db.pzsvbqfzacidkeqavgfh.supabase.co",
        database="postgres",
        user="postgres",
        password="affan@805032",
        port=6543,
        sslmode='require' # Supabase requires SSL
    )
    
    print("Connecting to New MySQL Database (Ender Cloud) using Tortoise...")
    # Initialize tortoise so models are available and we can build tables
    await Tortoise.init(config.TORTOISE)
    
    print("Generating Schemas in MySQL...")
    await Tortoise.generate_schemas(safe=True)
    
    from tortoise.models import Model
    from tortoise import Tortoise
    
    # Get all registered Tortoise models
    if not Tortoise.apps.get("models"):
        print("Initializing models module...")
        import models as db_models
        
    models = Tortoise.apps.get("models", {})
        
    print(f"Found {len(models)} models to migrate.")

    for model_name, model_class in models.items():
        table_name = model_class._meta.db_table
        if not table_name:
            continue
            
        try:
            # 1. Fetch from Postgres
            rows = fetch_postgres_data(pg_conn, table_name)
            if not rows:
                print(f"[{table_name}] 0 rows found. Skipping.")
                continue
                
            print(f"[{table_name}] Found {len(rows)} rows in Postgres. Inserting to MySQL...")
            
            # 2. Insert into MySQL using raw dictionaries or Model instantiation
            # We insert one by one to catch and handle any individual type mismatch issues
            success_count = 0
            for row in rows:
                try:
                    # Clean up arrays if needed, Tortoise ArrayField maps to JSON internally in MySQL
                    cleaned_row = {}
                    for k, v in row.items():
                        if isinstance(v, list):
                            import json
                            cleaned_row[k] = json.dumps(v)
                        else:
                            cleaned_row[k] = v
                    
                    obj = model_class(**cleaned_row)
                    await obj.save(force_insert=True)
                    success_count += 1
                except Exception as e:
                    # e.g., duplicate key if it already exists
                    print(f"  -> Error inserting row into {table_name}: {e}")
                    
            print(f"[{table_name}] Successfully migrated {success_count}/{len(rows)} rows.")
            
        except Exception as e:
             print(f"[{table_name}] Unexpected Error: {e}")

    # Cleanup
    pg_conn.close()
    await Tortoise.close_connections()
    print("Migration finished!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(migrate_data())
