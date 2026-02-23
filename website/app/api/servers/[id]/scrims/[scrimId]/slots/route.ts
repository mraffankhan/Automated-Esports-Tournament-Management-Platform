import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; scrimId: string }> }
) {
    try {
        const { scrimId } = await params;

        // Get slot IDs from the join table
        const { data: slotJoins, error: joinError } = await supabase
            .from('sm.scrims_sm.assigned_slots')
            .select('assignedslot_id')
            .eq('sm.scrims_id', scrimId);

        if (joinError) {
            console.error('Error fetching slot joins:', joinError);
            return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
        }

        if (!slotJoins || slotJoins.length === 0) {
            return NextResponse.json([]);
        }

        const slotIds = slotJoins.map((j: any) => j.assignedslot_id);

        // Get the actual slot data
        const { data: slots, error: slotsError } = await supabase
            .from('sm.assigned_slots')
            .select('id, num, user_id, team_name, members, jump_url')
            .in('id', slotIds)
            .order('num', { ascending: true });

        if (slotsError) {
            console.error('Error fetching assigned slots:', slotsError);
            return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
        }

        return NextResponse.json(slots || []);

    } catch (error) {
        console.error('Error fetching scrim slots:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; scrimId: string }> }
) {
    try {
        const { scrimId } = await params;
        const { slotId } = await req.json();

        if (!slotId) {
            return NextResponse.json({ error: 'Missing slotId' }, { status: 400 });
        }

        // Remove from join table
        await supabase
            .from('sm.scrims_sm.assigned_slots')
            .delete()
            .eq('sm.scrims_id', scrimId)
            .eq('assignedslot_id', slotId);

        // Delete the slot itself
        await supabase
            .from('sm.assigned_slots')
            .delete()
            .eq('id', slotId);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting slot:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
