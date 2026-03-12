import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guildId } = await params;

        const [rows] = await db.query<any[]>(
            `SELECT id, guild_id, name, registration_channel_id, slotlist_channel_id, role_id, required_mentions, total_slots, host_id, open_time, opened_at, closed_at, stoggle, ping_role_id, multiregister, autoslotlist, autodelete_rejects, autodelete_extras, teamname_compulsion, no_duplicate_name, open_role_id, start_from 
             FROM \`sm.scrims\` 
             WHERE guild_id = ? 
             ORDER BY open_time ASC`,
            [guildId]
        );

        return NextResponse.json(rows || []);

    } catch (error) {
        console.error('Error fetching scrims:', error);
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
            slotlist_channel_id,
            total_slots,
            required_mentions = 4,
            ping_role_id = null,
            host_id,
            open_time,
        } = body;

        // Validate required fields
        if (!name || !registration_channel_id || !slotlist_channel_id || !total_slots || !host_id || !open_time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
        }

        // 1. Create a Discord role for this scrim
        const roleResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                color: 0x00FFB3,
                mentionable: false,
            }),
        });

        if (!roleResponse.ok) {
            const err = await roleResponse.json().catch(() => ({}));
            console.error('Discord role creation error:', roleResponse.status, err);
            return NextResponse.json({ error: 'Failed to create scrim role in Discord' }, { status: 500 });
        }

        const role = await roleResponse.json();

        // 2. Generate a unique ID (snowflake-like)
        const uniqueId = BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000));

        await db.query(`
            INSERT INTO \`sm.scrims\` (
                id, guild_id, name, registration_channel_id, slotlist_channel_id, role_id, 
                total_slots, required_mentions, ping_role_id, host_id, open_time, 
                stoggle, autoslotlist, autodelete_extras, start_from
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            uniqueId.toString(), guildId, name, registration_channel_id, slotlist_channel_id, role.id,
            total_slots, required_mentions, ping_role_id || null, host_id, open_time,
            1, 1, 1, 1
        ]);

        return NextResponse.json({
            id: uniqueId.toString(), guild_id: guildId, name, registration_channel_id, slotlist_channel_id,
            role_id: role.id, total_slots, required_mentions, ping_role_id, host_id, open_time,
            stoggle: 1, autoslotlist: 1, autodelete_extras: 1, start_from: 1
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating scrim:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
