import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthorizedDev } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        // 1. Verify Developer Access
        if (!isAuthorizedDev(userId)) {
            return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
        }

        // 2. Fetch all public tables from information_schema
        const [tables]: any = await db.execute(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 's1336_Argon' 
            ORDER BY table_name;
        `);

        // 3. Fetch total database size in bytes
        const [sizeRes]: any = await db.execute(`
            SELECT SUM(data_length + index_length) AS total_bytes
            FROM information_schema.tables 
            WHERE table_schema = 's1336_Argon';
        `);
        const usedBytes = Number(sizeRes[0]?.total_bytes) || 0;
        const totalBytes = Number(process.env.DB_MAX_STORAGE_MB || 1024) * 1024 * 1024; // Default 1GB

        // 4. Return array of table names and storage data
        const tableNames = tables.map((t: any) => t.TABLE_NAME || t.table_name);
        return NextResponse.json({
            tables: tableNames,
            storage: {
                usedBytes,
                totalBytes
            }
        });

    } catch (error) {
        console.error("Error fetching tables:", error);
        return NextResponse.json({ error: 'Failed to fetch database tables.' }, { status: 500 });
    }
}
