import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guildId } = await params;

        const { data, error } = await supabase
            .from('tm.tourney')
            .select('id, guild_id, name, registration_channel_id, confirm_channel_id, role_id, required_mentions, total_slots, host_id, started_at, closed_at, multiregister, teamname_compulsion')
            .eq('guild_id', guildId)
            .order('id', { ascending: false });

        if (error) {
            console.error('Supabase error fetching tournaments:', error);
            return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
        }

        const tournaments = (data || []).map(t => ({
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

        // 3. Insert tournament into Supabase
        const { data, error } = await supabase
            .from('tm.tourney')
            .insert({
                id: tourneyId,
                guild_id: guildId,
                name: name,
                registration_channel_id: registration_channel_id,
                confirm_channel_id: confirm_channel_id,
                role_id: role.id,
                required_mentions: required_mentions,
                total_slots: total_slots,
                host_id: host_id,
                multiregister: false,
                teamname_compulsion: false,
                no_duplicate_name: true,
                autodelete_rejected: false,
                slotlist_start: 2,
                required_lines: 0,
                allow_duplicate_tags: true,
                banned_users: [],
                emojis: { tick: "\u2705", cross: "\u274C" },
                ping_role_id: ping_role_id,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            // Clean up the created role if DB insert fails
            await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${role.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bot ${botToken}` },
            });
            return NextResponse.json({ error: 'Failed to create tournament in database', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, tournament: data });

    } catch (error) {
        console.error('Error creating tournament:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
