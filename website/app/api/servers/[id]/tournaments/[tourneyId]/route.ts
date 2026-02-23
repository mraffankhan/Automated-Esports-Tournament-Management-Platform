import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; tourneyId: string }> }
) {
    try {
        const { id: guildId, tourneyId } = await params;

        const { data, error } = await supabase
            .from('tm.tourney')
            .select('*')
            .eq('id', tourneyId)
            .eq('guild_id', guildId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // Get slot count
        const { count } = await supabase
            .from('tm.tourney_tm.register')
            .select('*', { count: 'exact', head: true })
            .eq('tm.tourney_id', tourneyId);

        return NextResponse.json({ ...data, slot_count: count || 0 });

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

        const updates: Record<string, any> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('tm.tourney')
            .update(updates)
            .eq('id', tourneyId)
            .eq('guild_id', guildId)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ error: 'Failed to update tournament', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, tournament: data });

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
        const { data: tourney, error: fetchError } = await supabase
            .from('tm.tourney')
            .select('role_id')
            .eq('id', tourneyId)
            .eq('guild_id', guildId)
            .single();

        if (fetchError || !tourney) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // 2. Delete associated slots
        // First get slot IDs from the junction table
        const { data: junctionData } = await supabase
            .from('tm.tourney_tm.register')
            .select('tmslot_id')
            .eq('tm.tourney_id', tourneyId);

        if (junctionData && junctionData.length > 0) {
            const slotIds = junctionData.map((j: any) => j.tmslot_id);
            await supabase.from('tm.register').delete().in('id', slotIds);
            await supabase.from('tm.tourney_tm.register').delete().eq('tm.tourney_id', tourneyId);
        }

        // 3. Delete tournament from Supabase
        const { error: deleteError } = await supabase
            .from('tm.tourney')
            .delete()
            .eq('id', tourneyId)
            .eq('guild_id', guildId);

        if (deleteError) {
            console.error('Supabase delete error:', deleteError);
            return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
        }

        // 4. Delete Discord role
        if (botToken && tourney.role_id) {
            try {
                await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${tourney.role_id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bot ${botToken}` },
                });
            } catch (err) {
                console.error('Failed to delete Discord role:', err);
                // Non-fatal — tournament is already deleted from DB
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting tournament:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
