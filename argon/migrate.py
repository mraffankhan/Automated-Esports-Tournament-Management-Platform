import asyncio
import ssl
import json
import subprocess

try:
    import asyncpg
except ImportError:
    subprocess.check_call(['pip', 'install', 'asyncpg'])
    import asyncpg

try:
    import aiomysql
except ImportError:
    subprocess.check_call(['pip', 'install', 'aiomysql'])
    import aiomysql


async def migrate_data():
    pg_url = 'postgresql://postgres:affan%40805032@db.pzsvbqfzacidkeqavgfh.supabase.co:5432/postgres'
    
    print('Connecting to Postgres (Supabase)...')
    try:
        pg_conn = await asyncpg.connect(pg_url)
        print('Connected to Postgres!')
    except Exception as e:
        print(f'Failed to connect to Postgres: {e}')
        return

    print('Connecting to MySQL (Endercloud)...')
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        my_conn = await aiomysql.connect(
            host='db.mum-1.endercloud.in',
            port=3306,
            user='u1336_EGjFu4y4L9',
            password='H!0PZBvdZAb58+HZ+^QG.850',
            db='s1336_Argon',
            ssl=ctx,
            autocommit=True
        )
        print('Connected to MySQL!')
    except Exception as e:
        print(f'Failed to connect to MySQL: {e}')
        await pg_conn.close()
        return

    tables_q = '''
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    '''
    tables = await pg_conn.fetch(tables_q)
    
    table_names = [t['table_name'] for t in tables if t['table_name'] != 'aerich']
    print(f'Found tables to migrate: {table_names}')

    for table in table_names:
        print(f'\nMigrating table {table}...')
        # Get data from postgres
        records = await pg_conn.fetch(f'SELECT * FROM "{table}"')
        if not records:
            print(f'No records found in {table}, skipping.')
            continue
            
        print(f'Found {len(records)} records in Postgres table {table}.')
        
        # Get columns
        columns = list(records[0].keys())
        cols_str = ', '.join(f'`{c}`' for c in columns)
        placeholders = ', '.join(['%s'] * len(columns))
        
        insert_query = f'INSERT IGNORE INTO `{table}` ({cols_str}) VALUES ({placeholders})'
        
        async with my_conn.cursor() as cur:
            success = 0
            for record in records:
                # Convert record to tuple, handling special types if needed
                values = []
                for col in columns:
                    val = record[col]
                    if isinstance(val, dict) or isinstance(val, list):
                        val = json.dumps(val)
                    values.append(val)
                
                try:
                    await cur.execute(insert_query, values)
                    success += 1
                except Exception as e:
                    print(f'Error inserting row into {table}: {e}')
                    
            print(f'Successfully migrated {success} rows for {table}.')

    await pg_conn.close()
    my_conn.close()
    print('\nMigration complete!')

asyncio.run(migrate_data())
