import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; tourneyId: string }> }
) {
    try {
        const { id: guildId, tourneyId } = await params;

        const [rows]: any = await db.execute(
            `SELECT * FROM \`tm.tourney\` WHERE id = ? AND guild_id = ? LIMIT 1`,
            [tourneyId, guildId]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // Get slot count
        const [countRows]: any = await db.execute(
            `SELECT COUNT(*) AS cnt FROM \`tm.tourney_tm.register\` WHERE \`tm.tourney_id\` = ?`,
            [tourneyId]
        );

        return NextResponse.json({ ...rows[0], slot_count: countRows[0]?.cnt || 0 });

    } catch (error) {
        console.error('Error fetching tournament:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; tourneyId: string }> }
) {
    try {
        const { id: guildId, tourneyId } = await params;
        const body = await req.json();

        // Only allow updating specific fields
        const allowedFields = [
            'name', 'total_slots', 'required_mentions', 'multiregister',
            'teamname_compulsion', 'no_duplicate_name', 'autodelete_rejected',
            'success_message', 'group_size', 'required_lines', 'allow_duplicate_tags',
            'registration_channel_id', 'confirm_channel_id', 'ping_role_id',
        ];

        const setClauses: string[] = [];
        const values: any[] = [];
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                setClauses.push(`\`${field}\` = ?`);
                values.push(body[field]);
            }
        }

        if (setClauses.length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        values.push(tourneyId, guildId);
        await db.execute(
            `UPDATE \`tm.tourney\` SET ${setClauses.join(', ')} WHERE id = ? AND guild_id = ?`,
            values
        );

        // Fetch updated record
        const [updated]: any = await db.execute(
            `SELECT * FROM \`tm.tourney\` WHERE id = ? AND guild_id = ? LIMIT 1`,
            [tourneyId, guildId]
        );

        return NextResponse.json({ success: true, tournament: updated[0] });

    } catch (error) {
        console.error('Error updating tournament:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; tourneyId: string }> }
) {
    try {
        const { id: guildId, tourneyId } = await params;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        // 1. Get tournament to find the role_id
        const [tourneyRows]: any = await db.execute(
            `SELECT role_id FROM \`tm.tourney\` WHERE id = ? AND guild_id = ? LIMIT 1`,
            [tourneyId, guildId]
        );

        if (!tourneyRows || tourneyRows.length === 0) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }
        const tourney = tourneyRows[0];

        // 2. Delete associated slots
        const [junctionRows]: any = await db.execute(
            `SELECT tmslot_id FROM \`tm.tourney_tm.register\` WHERE \`tm.tourney_id\` = ?`,
            [tourneyId]
        );

        if (junctionRows && junctionRows.length > 0) {
            const slotIds = junctionRows.map((j: any) => j.tmslot_id);
            const placeholders = slotIds.map(() => '?').join(',');
            await db.execute(`DELETE FROM \`tm.register\` WHERE id IN (${placeholders})`, slotIds);
            await db.execute(`DELETE FROM \`tm.tourney_tm.register\` WHERE \`tm.tourney_id\` = ?`, [tourneyId]);
        }

        // 3. Delete tournament from MySQL
        await db.execute(
            `DELETE FROM \`tm.tourney\` WHERE id = ? AND guild_id = ?`,
            [tourneyId, guildId]
        );

        // 4. Delete Discord role
        if (botToken && tourney.role_id) {
            try {
                await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${tourney.role_id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bot ${botToken}` },
                });
            } catch (err) {
                console.error('Failed to delete Discord role:', err);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting tournament:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
