import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthorizedDev } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { userId, action, table, payload } = await req.json();

        // 1. Verify Developer Access
        if (!isAuthorizedDev(userId)) {
            return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
        }

        if (!table || !/^[a-zA-Z0-9_.]+$/.test(table)) {
            return NextResponse.json({ error: 'Invalid table name.' }, { status: 400 });
        }

        let result: any, fields: any;

        // 2. Handle CRUD Operations securely via `mysql2` module
        switch (action) {
            case 'read':
                // Escape table name natively to avoid reserved word conflicts in MySQL
                [result, fields] = await db.execute(`SELECT * FROM \`${table}\` LIMIT 100 OFFSET ?`, [payload?.offset || 0]);
                break;

            case 'read_columns':
                [result, fields] = await db.execute(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = 's1336_Argon' AND table_name = ?
                `, [table]);
                break;

            case 'create':
                const insertKeys = Object.keys(payload);
                if (insertKeys.length === 0) throw new Error("No data provided");

                const placeholders = insertKeys.map(() => '?').join(', ');
                const cols = insertKeys.map(k => `\`${k}\``).join(', ');
                const values = Object.values(payload);

                [result, fields] = await db.execute(
                    `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`,
                    values as any[]
                );

                // MySQL doesn't natively support RETURNING *, so we just send success
                break;

            case 'update':
                const updateKeys = Object.keys(payload.data);
                if (updateKeys.length === 0 || !payload.idField || payload.idValue === undefined) {
                    throw new Error("Invalid update payload");
                }

                const setCols = updateKeys.map(k => `\`${k}\` = ?`).join(', ');
                const updateValues = [...Object.values(payload.data), payload.idValue];

                [result, fields] = await db.execute(
                    `UPDATE \`${table}\` SET ${setCols} WHERE \`${payload.idField}\` = ?`,
                    updateValues as any[]
                );
                break;

            case 'delete':
                if (!payload.idField || payload.idValue === undefined) {
                    throw new Error("Invalid delete payload");
                }

                [result, fields] = await db.execute(
                    `DELETE FROM \`${table}\` WHERE \`${payload.idField}\` = ?`,
                    [payload.idValue]
                );
                break;

            default:
                return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error(`Error during DB query [${req.method}] :`, error);
        return NextResponse.json({ error: error.message || 'Failed database operation.' }, { status: 500 });
    }
}
