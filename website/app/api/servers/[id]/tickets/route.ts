import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guildId } = await params;

        // Fetch tickets for this guild
        const { data: tickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('id, guild_id, channel_id, opener_id, config_id, opened_at, closed_at, closed_by, reason')
            .eq('guild_id', guildId)
            .order('opened_at', { ascending: false });

        if (ticketsError) {
            console.error('Supabase error fetching tickets:', ticketsError);
            return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
        }

        // Fetch ticket configs for this guild to get panel titles
        const { data: configs, error: configsError } = await supabase
            .from('ticket_configs')
            .select('id, title, channel_id, category_id, support_role_id, log_channel_id, max_tickets')
            .eq('guild_id', guildId);

        if (configsError) {
            console.error('Supabase error fetching ticket configs:', configsError);
            return NextResponse.json({ error: 'Failed to fetch ticket configs' }, { status: 500 });
        }

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
            const { data, error } = await supabase
                .from('tickets')
                .update({
                    closed_at: new Date().toISOString(),
                    closed_by: userId || null,
                })
                .eq('id', ticketId)
                .eq('guild_id', guildId)
                .select()
                .single();

            if (error) {
                console.error('Supabase error closing ticket:', error);
                return NextResponse.json({ error: 'Failed to close ticket' }, { status: 500 });
            }

            return NextResponse.json({ success: true, ticket: data });
        }

        if (action === 'reopen') {
            const { data, error } = await supabase
                .from('tickets')
                .update({
                    closed_at: null,
                    closed_by: null,
                })
                .eq('id', ticketId)
                .eq('guild_id', guildId)
                .select()
                .single();

            if (error) {
                console.error('Supabase error reopening ticket:', error);
                return NextResponse.json({ error: 'Failed to reopen ticket' }, { status: 500 });
            }

            return NextResponse.json({ success: true, ticket: data });
        }

        return NextResponse.json({ error: 'Invalid action. Use "close" or "reopen".' }, { status: 400 });

    } catch (error) {
        console.error('Error updating ticket:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
