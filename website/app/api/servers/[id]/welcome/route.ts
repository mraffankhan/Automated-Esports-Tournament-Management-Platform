import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guildId } = await params;
        console.log(`[Welcome API] GET request for guildId: ${guildId}`);

        const { data, error } = await supabase
            .from('welcome_configs')
            // Convert channel_id to text to avoid BIGINT precision loss in JS
            .select('*, channel_id::text')
            .eq('guild_id', guildId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error('[Welcome API] Supabase error fetching welcome config:', error);
            return NextResponse.json({ error: 'Failed to fetch welcome config' }, { status: 500 });
        }

        const welcomeData = data || {
            guild_id: guildId,
            channel_id: null,
            message: 'Welcome {user} to **{server}**! You are member #{member_count}.',
            enabled: false,
            embed_enabled: false,
            embed_color: 65459,
            embed_title: 'Welcome!'
        };

        // Ensure guild_id is a string and use the exact string from the URL to avoid precision loss
        welcomeData.guild_id = guildId;

        return NextResponse.json(welcomeData);

    } catch (error) {
        console.error('[Welcome API] Error fetching welcome config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guildId } = await params;
        const body = await req.json();
        console.log(`[Welcome API] PUT request for guildId: ${guildId}`, body);

        // Always override guild_id from params, discarding body's potentially precision-lost value
        body.guild_id = guildId;


        const { data, error } = await supabase
            .from('welcome_configs')
            .upsert({
                guild_id: guildId, // Use the ID from the URL param
                channel_id: body.channel_id,
                message: body.message,
                enabled: body.enabled,
                embed_enabled: body.embed_enabled,
                embed_color: body.embed_color,
                embed_title: body.embed_title
            })
            .select('*, channel_id::text')
            .single();

        if (error) {
            console.error('[Welcome API] Supabase error updating welcome config:', error);
            return NextResponse.json({ error: 'Failed to update welcome config' }, { status: 500 });
        }

        // Always use original guildId from URL params to ensure perfect precision
        if (data) {
            data.guild_id = guildId;
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('[Welcome API] Error updating welcome config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
