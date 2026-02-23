import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; scrimId: string }> }
) {
    try {
        const { id: guildId, scrimId } = await params;

        const { data, error } = await supabase
            .from('sm.scrims')
            .select('*')
            .eq('id', scrimId)
            .eq('guild_id', guildId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Scrim not found' }, { status: 404 });
        }

        // Get slot count from the join table
        const { count } = await supabase
            .from('sm.scrims_sm.assigned_slots')
            .select('*', { count: 'exact', head: true })
            .eq('sm.scrims_id', scrimId);

        return NextResponse.json({ ...data, slot_count: count || 0 });

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

        const { data, error } = await supabase
            .from('sm.scrims')
            .update(updates)
            .eq('id', scrimId)
            .eq('guild_id', guildId)
            .select()
            .single();

        if (error) {
            console.error('Supabase error updating scrim:', error);
            return NextResponse.json({ error: 'Failed to update scrim', details: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

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
        const { data: scrim, error: fetchError } = await supabase
            .from('sm.scrims')
            .select('role_id')
            .eq('id', scrimId)
            .eq('guild_id', guildId)
            .single();

        if (fetchError || !scrim) {
            return NextResponse.json({ error: 'Scrim not found' }, { status: 404 });
        }

        // 2. Delete assigned slots (via join table)
        const { data: slotJoins } = await supabase
            .from('sm.scrims_sm.assigned_slots')
            .select('assignedslot_id')
            .eq('sm.scrims_id', scrimId);

        if (slotJoins && slotJoins.length > 0) {
            const slotIds = slotJoins.map((j: any) => j.assignedslot_id);
            await supabase.from('sm.assigned_slots').delete().in('id', slotIds);
            await supabase.from('sm.scrims_sm.assigned_slots').delete().eq('sm.scrims_id', scrimId);
        }

        // 3. Delete reserved slots (via join table)
        const { data: reservedJoins } = await supabase
            .from('sm.scrims_sm.reserved_slots')
            .select('reservedslot_id')
            .eq('sm.scrims_id', scrimId);

        if (reservedJoins && reservedJoins.length > 0) {
            const reservedIds = reservedJoins.map((j: any) => j.reservedslot_id);
            await supabase.from('sm.reserved_slots').delete().in('id', reservedIds);
            await supabase.from('sm.scrims_sm.reserved_slots').delete().eq('sm.scrims_id', scrimId);
        }

        // 4. Delete the scrim itself
        const { error: deleteError } = await supabase
            .from('sm.scrims')
            .delete()
            .eq('id', scrimId)
            .eq('guild_id', guildId);

        if (deleteError) {
            console.error('Supabase error deleting scrim:', deleteError);
            return NextResponse.json({ error: 'Failed to delete scrim' }, { status: 500 });
        }

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
