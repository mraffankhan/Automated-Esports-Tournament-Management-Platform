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
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error('[Welcome API] Supabase error fetching welcome config:', error);
            return NextResponse.json({ error: 'Failed to fetch welcome config' }, { status: 500 });
        }

        return NextResponse.json(data || {
            guild_id: guildId,
            channel_id: null,
            message: 'Welcome {user} to **{server}**! You are member #{member_count}.',
            enabled: false,
            embed_enabled: false,
            embed_color: 65459,
            embed_title: 'Welcome!'
        });

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

        // Validate guildId matches
        // Normalize both to strings to avoid type mismatch (BIGINT might come back as number)
        if (body.guild_id && String(body.guild_id) !== String(guildId)) {
            console.warn(`[Welcome API] Guild ID mismatch. Body: ${body.guild_id}, Params: ${guildId}`);
            return NextResponse.json({ error: 'Guild ID mismatch', details: { body: body.guild_id, params: guildId } }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('welcome_configs')
            .upsert({
                guild_id: guildId,
                channel_id: body.channel_id,
                message: body.message,
                enabled: body.enabled,
                embed_enabled: body.embed_enabled,
                embed_color: body.embed_color,
                embed_title: body.embed_title
            })
            .select()
            .single();

        if (error) {
            console.error('[Welcome API] Supabase error updating welcome config:', error);
            return NextResponse.json({ error: 'Failed to update welcome config' }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('[Welcome API] Error updating welcome config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
