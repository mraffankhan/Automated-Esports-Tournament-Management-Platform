import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guildId } = await params;

        const [rows]: any = await db.execute(
            `SELECT id, guild_id, name, registration_channel_id, confirm_channel_id, role_id, required_mentions, total_slots, host_id, started_at, closed_at, multiregister, teamname_compulsion 
             FROM \`tm.tourney\` 
             WHERE guild_id = ? 
             ORDER BY id DESC`,
            [guildId]
        );

        const tournaments = (rows || []).map((t: any) => ({
            ...t,
            guild_id: String(t.guild_id)
        }));

        return NextResponse.json(tournaments);

    } catch (error) {
        console.error('Error fetching tournaments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guildId } = await params;
        const body = await req.json();

        const {
            name,
            registration_channel_id,
            confirm_channel_id,
            total_slots,
            required_mentions = 4,
            ping_role_id = null,
            host_id,
        } = body;

        // Validate required fields
        if (!name || !registration_channel_id || !confirm_channel_id || !total_slots || !host_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
        }

        // 1. Create a role in the Discord server for this tournament
        const roleResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                color: 0xab48d1,
                mentionable: false,
            }),
        });

        if (!roleResponse.ok) {
            const err = await roleResponse.json().catch(() => ({}));
            console.error('Discord role creation error:', roleResponse.status, err);
            return NextResponse.json({ error: 'Failed to create tournament role in Discord' }, { status: 500 });
        }

        const role = await roleResponse.json();

        // 2. Generate a unique ID for the tournament (snowflake-like)
        const tourneyId = Date.now();

        // 3. Insert tournament into MySQL
        const emojisJSON = JSON.stringify({ tick: "✅", cross: "❌" });

        try {
            await db.execute(
                `INSERT INTO \`tm.tourney\` (
                    id, guild_id, name, registration_channel_id, confirm_channel_id, role_id, 
                    required_mentions, total_slots, host_id, multiregister, teamname_compulsion, 
                    no_duplicate_name, autodelete_rejected, slotlist_start, required_lines, 
                    allow_duplicate_tags, banned_users, emojis, ping_role_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tourneyId, guildId, name, registration_channel_id, confirm_channel_id, role.id,
                    required_mentions, total_slots, host_id, 0, 0,
                    1, 0, 2, 0,
                    1, JSON.stringify([]), emojisJSON, ping_role_id
                ]
            );

            // Fetch the inserted record to return it
            const [inserted]: any = await db.execute(
                `SELECT * FROM \`tm.tourney\` WHERE id = ? LIMIT 1`,
                [tourneyId]
            );

            return NextResponse.json({ success: true, tournament: inserted[0] });
        } catch (error: any) {
            console.error('MySQL insert error:', error);
            // Clean up the created role if DB insert fails
            await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${role.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bot ${botToken}` },
            });
            return NextResponse.json({ error: 'Failed to create tournament in database', details: error.message }, { status: 500 });
        }

    } catch (error) {
        console.error('Error creating tournament:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
