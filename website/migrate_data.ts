import postgres from 'postgres';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Old Supabase Postgres Connection
const pg = postgres('postgres://postgres:affan@805032@db.pzsvbqfzacidkeqavgfh.supabase.co:5432/postgres', {
    ssl: { rejectUnauthorized: false }
});

// New Ender Cloud MySQL Connection
const my = mysql.createPool({
    host: 'db.mum-1.endercloud.in',
    port: 3306,
    user: 'u1336_EGjFu4y4L9',
    password: 'H!0PZBvdZAb58+HZ+^QG.850',
    database: 's1336_Argon',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function migrate() {
    console.log("Starting JS Data Migration...");
    try {
        // 1. Fetch public tables from Postgres
        const tables = await pg`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name != 'aerich';
        `;

        console.log(`Found ${tables.length} tables to migrate.`);

        for (const t of tables) {
            const tableName = t.table_name;
            console.log(`\n[${tableName}] Fetching rows from Postgres...`);

            try {
                // Fetch Data
                const rows = await pg`SELECT * FROM ${pg(tableName)}`;
                if (rows.length === 0) {
                    console.log(`[${tableName}] 0 rows. Skipping.`);
                    continue;
                }

                console.log(`[${tableName}] Found ${rows.length} rows. Preparing to insert to MySQL.`);

                // Inspect first row to dynamically build the query
                const firstRow = rows[0];
                const columns = Object.keys(firstRow);

                // MySQL prepared statement placeholders (?, ?, ?)
                const placeholders = columns.map(() => '?').join(', ');
                const colNames = columns.map(c => `\`${c}\``).join(', ');

                const insertQuery = `INSERT IGNORE INTO \`${tableName}\` (${colNames}) VALUES (${placeholders})`;

                let successCount = 0;
                for (const row of rows) {
                    try {
                        // Extract values in the same order as columns
                        const values = columns.map(col => {
                            let val = row[col];
                            // Handle postgres arrays/objects
                            if (Array.isArray(val) || (typeof val === 'object' && val !== null && !(val instanceof Date))) {
                                return JSON.stringify(val);
                            }
                            // Handle boolean translation explicitly if needed, though mysql2 usually casts true/false
                            return val;
                        });

                        await my.execute(insertQuery, values);
                        successCount++;
                    } catch (rowErr: any) {
                        if (!rowErr.message.includes("Table") && !rowErr.message.includes("doesn't exist")) {
                            console.log(`  -> Row error in ${tableName}:`, rowErr.message);
                        } else {
                            // Table doesn't exist, we break the row loop and log it once
                            throw rowErr;
                        }
                    }
                }
                console.log(`[${tableName}] Migrated ${successCount}/${rows.length} rows.`);

            } catch (err: any) {
                if (err.message && err.message.includes("doesn't exist")) {
                    console.log(`[${tableName}] Target table does not exist in MySQL yet. Make sure Tortoise ORM generates tables first!`);
                } else {
                    console.log(`[${tableName}] Query Error:`, err.message);
                }
            }
        }

    } catch (e: any) {
        console.error("Migration fatal error:", e);
    } finally {
        await pg.end();
        await my.end();
        console.log("\nMigration completed.");
    }
}

migrate();
