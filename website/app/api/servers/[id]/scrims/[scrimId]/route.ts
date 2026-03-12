import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; scrimId: string }> }
) {
    try {
        const { id: guildId, scrimId } = await params;

        const [rows] = await db.query<any[]>(
            `SELECT * FROM \`sm.scrims\` WHERE id = ? AND guild_id = ? LIMIT 1`,
            [scrimId, guildId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Scrim not found' }, { status: 404 });
        }
        const data = rows[0];

        // Get slot count from the join table
        const [countRows] = await db.query<any[]>(
            `SELECT COUNT(*) as count FROM \`sm.scrims_sm.assigned_slots\` WHERE \`sm.scrims_id\` = ?`,
            [scrimId]
        );

        return NextResponse.json({ ...data, slot_count: countRows[0].count || 0 });

    } catch (error) {
        console.error('Error fetching scrim:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; scrimId: string }> }
) {
    try {
        const { id: guildId, scrimId } = await params;
        const body = await req.json();

        // Allowed fields to update
        const allowedFields = [
            'name', 'total_slots', 'required_mentions', 'open_time',
            'slotlist_channel_id', 'registration_channel_id', 'ping_role_id',
            'open_role_id', 'stoggle', 'autoslotlist', 'autodelete_rejects',
            'autodelete_extras', 'teamname_compulsion', 'no_duplicate_name',
            'multiregister', 'start_from', 'required_lines',
        ];

        const updates: Record<string, any> = {};
        for (const key of allowedFields) {
            if (key in body) {
                updates[key] = body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const setClauses = [];
        const values = [];
        for (const [key, value] of Object.entries(updates)) {
            setClauses.push(`\`${key}\` = ?`);
            values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
        }
        values.push(scrimId, guildId);

        await db.query(`UPDATE \`sm.scrims\` SET ${setClauses.join(', ')} WHERE id = ? AND guild_id = ?`, values);

        return NextResponse.json({ success: true, ...updates });

    } catch (error) {
        console.error('Error updating scrim:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; scrimId: string }> }
) {
    try {
        const { id: guildId, scrimId } = await params;

        // 1. Get the scrim first to find the role_id
        const [scrimRows] = await db.query<any[]>(
            `SELECT role_id FROM \`sm.scrims\` WHERE id = ? AND guild_id = ?`,
            [scrimId, guildId]
        );

        if (scrimRows.length === 0) {
            return NextResponse.json({ error: 'Scrim not found' }, { status: 404 });
        }
        const scrim = scrimRows[0];

        // 2. Delete assigned slots (via join table)
        const [slotJoins] = await db.query<any[]>(
            `SELECT assignedslot_id FROM \`sm.scrims_sm.assigned_slots\` WHERE \`sm.scrims_id\` = ?`,
            [scrimId]
        );

        if (slotJoins && slotJoins.length > 0) {
            const slotIds = slotJoins.map((j: any) => j.assignedslot_id);
            const placeholders = slotIds.map(() => '?').join(',');
            await db.query(`DELETE FROM \`sm.assigned_slots\` WHERE id IN (${placeholders})`, slotIds);
            await db.query(`DELETE FROM \`sm.scrims_sm.assigned_slots\` WHERE \`sm.scrims_id\` = ?`, [scrimId]);
        }

        // 3. Delete reserved slots (via join table)
        const [reservedJoins] = await db.query<any[]>(
            `SELECT reservedslot_id FROM \`sm.scrims_sm.reserved_slots\` WHERE \`sm.scrims_id\` = ?`,
            [scrimId]
        );

        if (reservedJoins && reservedJoins.length > 0) {
            const reservedIds = reservedJoins.map((j: any) => j.reservedslot_id);
            const placeholders = reservedIds.map(() => '?').join(',');
            await db.query(`DELETE FROM \`sm.reserved_slots\` WHERE id IN (${placeholders})`, reservedIds);
            await db.query(`DELETE FROM \`sm.scrims_sm.reserved_slots\` WHERE \`sm.scrims_id\` = ?`, [scrimId]);
        }

        // 4. Delete the scrim itself
        await db.query(`DELETE FROM \`sm.scrims\` WHERE id = ? AND guild_id = ?`, [scrimId, guildId]);

        // 5. Try to delete the Discord role (non-blocking)
        if (scrim.role_id) {
            const botToken = process.env.DISCORD_BOT_TOKEN;
            if (botToken) {
                fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${scrim.role_id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bot ${botToken}` },
                }).catch(err => console.error('Error deleting Discord role:', err));
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting scrim:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
