import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; tourneyId: string }> }
) {
    try {
        const { tourneyId } = await params;

        // Get slot IDs from junction table
        const { data: junctionData, error: jError } = await supabase
            .from('tm.tourney_tm.register')
            .select('tmslot_id')
            .eq('tm.tourney_id', tourneyId);

        if (jError) {
            console.error('Junction query error:', jError);
            return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
        }

        if (!junctionData || junctionData.length === 0) {
            return NextResponse.json([]);
        }

        const slotIds = junctionData.map((j: any) => j.tmslot_id);

        // Get actual slot data
        const { data: slots, error: sError } = await supabase
            .from('tm.register')
            .select('id, num, team_name, leader_id, members, jump_url, confirm_jump_url')
            .in('id', slotIds)
            .order('num', { ascending: true });

        if (sError) {
            console.error('Slots query error:', sError);
            return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
        }

        return NextResponse.json(slots || []);

    } catch (error) {
        console.error('Error fetching slots:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; tourneyId: string }> }
) {
    try {
        const { tourneyId } = await params;
        const { slotId } = await req.json();

        if (!slotId) {
            return NextResponse.json({ error: 'Missing slotId' }, { status: 400 });
        }

        // Remove from junction table
        await supabase
            .from('tm.tourney_tm.register')
            .delete()
            .eq('tm.tourney_id', tourneyId)
            .eq('tmslot_id', slotId);

        // Delete the slot itself
        const { error } = await supabase
            .from('tm.register')
            .delete()
            .eq('id', slotId);

        if (error) {
            console.error('Slot delete error:', error);
            return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting slot:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
