import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; scrimId: string }> }
) {
    try {
        const { scrimId } = await params;

        // Get slot IDs from the join table
        const [slotJoins] = await db.query<any[]>(
            `SELECT assignedslot_id FROM \`sm.scrims_sm.assigned_slots\` WHERE \`sm.scrims_id\` = ?`,
            [scrimId]
        );

        if (!slotJoins || slotJoins.length === 0) {
            return NextResponse.json([]);
        }

        const slotIds = slotJoins.map((j: any) => j.assignedslot_id);
        const placeholders = slotIds.map(() => '?').join(',');

        // Get the actual slot data
        const [slots] = await db.query<any[]>(
            `SELECT id, num, user_id, team_name, members, jump_url FROM \`sm.assigned_slots\` WHERE id IN (${placeholders}) ORDER BY num ASC`,
            slotIds
        );

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
        await db.query(
            `DELETE FROM \`sm.scrims_sm.assigned_slots\` WHERE \`sm.scrims_id\` = ? AND assignedslot_id = ?`,
            [scrimId, slotId]
        );

        // Delete the slot itself
        await db.query(
            `DELETE FROM \`sm.assigned_slots\` WHERE id = ?`,
            [slotId]
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting slot:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
