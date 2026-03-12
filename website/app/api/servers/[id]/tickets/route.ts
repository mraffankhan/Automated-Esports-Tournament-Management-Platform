import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guildId } = await params;

        // Fetch tickets for this guild
        const [tickets] = await db.query<any[]>(
            `SELECT id, guild_id, channel_id, opener_id, config_id, opened_at, closed_at, closed_by, reason 
             FROM \`tickets\` WHERE guild_id = ? ORDER BY opened_at DESC`,
            [guildId]
        );

        // Fetch ticket configs for this guild to get panel titles
        const [configs] = await db.query<any[]>(
            `SELECT id, title, channel_id, category_id, support_role_id, log_channel_id, max_tickets 
             FROM \`ticket_configs\` WHERE guild_id = ?`,
            [guildId]
        );

        // Build a map of config_id -> title
        const configMap: Record<number, string> = {};
        for (const c of (configs || [])) {
            configMap[c.id] = c.title;
        }

        // Enrich tickets with the panel title
        const enriched = (tickets || []).map((t: any) => ({
            ...t,
            panel_title: configMap[t.config_id] || 'Unknown Panel',
        }));

        return NextResponse.json({
            tickets: enriched,
            configs: configs || [],
        });

    } catch (error) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guildId } = await params;
        const body = await req.json();

        const { ticketId, action, userId } = body;

        if (!ticketId || !action) {
            return NextResponse.json({ error: 'Missing ticketId or action' }, { status: 400 });
        }

        if (action === 'close') {
            try {
                const now = new Date().toISOString();
                await db.query(
                    `UPDATE \`tickets\` SET closed_at = ?, closed_by = ? WHERE id = ? AND guild_id = ?`,
                    [now, userId || null, ticketId, guildId]
                );

                // Fetch the updated ticket
                const [rows] = await db.query<any[]>(`SELECT * FROM \`tickets\` WHERE id = ? AND guild_id = ?`, [ticketId, guildId]);
                return NextResponse.json({ success: true, ticket: rows[0] });
            } catch (error) {
                console.error('MySQL error closing ticket:', error);
                return NextResponse.json({ error: 'Failed to close ticket' }, { status: 500 });
            }
        }

        if (action === 'reopen') {
            try {
                await db.query(
                    `UPDATE \`tickets\` SET closed_at = NULL, closed_by = NULL WHERE id = ? AND guild_id = ?`,
                    [ticketId, guildId]
                );

                // Fetch the updated ticket
                const [rows] = await db.query<any[]>(`SELECT * FROM \`tickets\` WHERE id = ? AND guild_id = ?`, [ticketId, guildId]);
                return NextResponse.json({ success: true, ticket: rows[0] });
            } catch (error) {
                console.error('MySQL error reopening ticket:', error);
                return NextResponse.json({ error: 'Failed to reopen ticket' }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action. Use "close" or "reopen".' }, { status: 400 });

    } catch (error) {
        console.error('Error updating ticket:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
