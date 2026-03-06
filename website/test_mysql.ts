import { db } from './lib/db';

async function test() {
    try {
        console.log("Testing connection...");
        const [tables]: any = await db.execute(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 's1336_Argon' 
            ORDER BY table_name;
        `);
        console.log(tables.map((t: any) => t.TABLE_NAME || t.table_name));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.end();
    }
}
test();
