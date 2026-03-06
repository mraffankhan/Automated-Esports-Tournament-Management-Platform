import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:affan@805032@db.pzsvbqfzacidkeqavgfh.supabase.co:5432/postgres';

const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        console.log("Connecting using:", connectionString);
        const result = await sql`SELECT 1 as result`;
        console.log("Connection successful:", result);
    } catch (e: any) {
        console.error("Connection failed!");
        console.error(e.message);
    } finally {
        await sql.end();
    }
}

test();
