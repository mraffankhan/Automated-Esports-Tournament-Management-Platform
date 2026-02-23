import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; tourneyId: string }> }
) {
    try {
        const { id: guildId, tourneyId } = await params;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
        }

        // 1. Fetch the tournament
        const { data: tourney, error: fetchError } = await supabase
            .from('tm.tourney')
            .select('*')
            .eq('id', tourneyId)
            .eq('guild_id', guildId)
            .single();

        if (fetchError || !tourney) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        console.log('[Toggle] Tournament:', tourney.name, '| Reg Channel:', tourney.registration_channel_id, '| Open Role:', tourney.open_role_id, '| Ping Role:', tourney.ping_role_id);

        const isCurrentlyOpen = tourney.started_at && !tourney.closed_at;
        const now = new Date().toISOString();
        const openRoleId = tourney.open_role_id || guildId;

        if (isCurrentlyOpen) {
            // ===== PAUSE: close registrations =====
            await supabase
                .from('tm.tourney')
                .update({ started_at: null, closed_at: now })
                .eq('id', tourneyId);

            // Update channel permissions — deny send_messages
            console.log('[Toggle PAUSE] Updating perms for channel:', tourney.registration_channel_id, 'role:', openRoleId);
            const permRes = await fetch(
                `https://discord.com/api/v10/channels/${tourney.registration_channel_id}/permissions/${openRoleId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bot ${botToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: openRoleId,
                        type: 0,
                        deny: '2048',
                        allow: '0',
                    }),
                }
            );
            if (!permRes.ok) {
                const permErr = await permRes.text();
                console.error('[Toggle PAUSE] Perm update FAILED:', permRes.status, permErr);
            } else {
                console.log('[Toggle PAUSE] Perms updated OK');
            }

            // Send pause message
            const msgBody = {
                embeds: [{
                    description: `**${tourney.name} registration paused.**`,
                    color: 0xab48d1,
                }],
            };
            console.log('[Toggle PAUSE] Sending msg to channel:', tourney.registration_channel_id);
            console.log('[Toggle PAUSE] Body:', JSON.stringify(msgBody));

            const msgRes = await fetch(`https://discord.com/api/v10/channels/${tourney.registration_channel_id}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${botToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(msgBody),
            });

            if (!msgRes.ok) {
                const msgErr = await msgRes.text();
                console.error('[Toggle PAUSE] Msg FAILED:', msgRes.status, msgErr);
            } else {
                const msgData = await msgRes.json();
                console.log('[Toggle PAUSE] Msg sent OK, id:', msgData.id);
            }

            return NextResponse.json({ success: true, status: 'paused' });

        } else {
            // ===== START: open registrations =====
            const { count } = await supabase
                .from('tm.tourney_tm.register')
                .select('*', { count: 'exact', head: true })
                .eq('tm.tourney_id', tourneyId);

            if ((count || 0) >= tourney.total_slots) {
                return NextResponse.json({ error: 'Slots are already full. Increase slots to start again.' }, { status: 400 });
            }

            await supabase
                .from('tm.tourney')
                .update({ started_at: now, closed_at: null })
                .eq('id', tourneyId);

            // Update channel permissions — allow send_messages
            console.log('[Toggle START] Updating perms for channel:', tourney.registration_channel_id, 'role:', openRoleId);
            const permRes = await fetch(
                `https://discord.com/api/v10/channels/${tourney.registration_channel_id}/permissions/${openRoleId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bot ${botToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: openRoleId,
                        type: 0,
                        allow: '2048',
                        deny: '0',
                    }),
                }
            );
            if (!permRes.ok) {
                const permErr = await permRes.text();
                console.error('[Toggle START] Perm update FAILED:', permRes.status, permErr);
            } else {
                console.log('[Toggle START] Perms updated OK');
            }

            // Get guild icon
            const slotsLeft = tourney.total_slots - (count || 0);
            let iconUrl: string | null = null;
            try {
                const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
                    headers: { 'Authorization': `Bot ${botToken}` },
                });
                if (guildRes.ok) {
                    const guildData = await guildRes.json();
                    if (guildData.icon) {
                        iconUrl = `https://cdn.discordapp.com/icons/${guildId}/${guildData.icon}.png`;
                    }
                }
            } catch (e) {
                console.error('[Toggle START] Guild icon fetch error:', e);
            }

            // Build ping content
            let pingContent: string | undefined;
            if (tourney.ping_role_id) {
                if (String(tourney.ping_role_id) === String(guildId)) {
                    pingContent = '@everyone';
                } else {
                    pingContent = `<@&${tourney.ping_role_id}>`;
                }
            }

            const msgBody: Record<string, unknown> = {
                embeds: [{
                    description: `**Registration Open for ${tourney.name}**\n\`\`\`📣 ${tourney.required_mentions} mentions required.\n📣 Total slots: ${tourney.total_slots} [${slotsLeft} slots left]\`\`\``,
                    color: 0xab48d1,
                    ...(iconUrl ? { thumbnail: { url: iconUrl } } : {}),
                }],
                allowed_mentions: {
                    roles: tourney.ping_role_id ? [String(tourney.ping_role_id)] : [],
                    parse: String(tourney.ping_role_id) === String(guildId) ? ['everyone'] : [],
                },
            };
            if (pingContent) {
                msgBody.content = pingContent;
            }

            console.log('[Toggle START] Sending msg to channel:', tourney.registration_channel_id);
            console.log('[Toggle START] Body:', JSON.stringify(msgBody));

            const msgRes = await fetch(`https://discord.com/api/v10/channels/${tourney.registration_channel_id}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${botToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(msgBody),
            });

            if (!msgRes.ok) {
                const msgErr = await msgRes.text();
                console.error('[Toggle START] Msg FAILED:', msgRes.status, msgErr);
            } else {
                const msgData = await msgRes.json();
                console.log('[Toggle START] Msg sent OK, id:', msgData.id);
            }

            return NextResponse.json({ success: true, status: 'started' });
        }

    } catch (error) {
        console.error('Error toggling registration:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
