import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; scrimId: string }> }
) {
    try {
        const { id: guildId, scrimId } = await params;

        // 1. Get the scrim
        const [scrimRows] = await db.query<any[]>(
            `SELECT * FROM \`sm.scrims\` WHERE id = ? AND guild_id = ?`,
            [scrimId, guildId]
        );

        if (scrimRows.length === 0) {
            return NextResponse.json({ error: 'Scrim not found' }, { status: 404 });
        }
        const scrim = scrimRows[0];

        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
        }

        const isCurrentlyOpen = scrim.opened_at && (!scrim.closed_at || new Date(scrim.closed_at) < new Date(scrim.opened_at));
        const now = new Date().toISOString();

        if (isCurrentlyOpen) {
            // CLOSE registration
            // 1. Update scrim in database
            try {
                await db.query(
                    `UPDATE \`sm.scrims\` SET closed_at = ?, opened_at = NULL WHERE id = ?`,
                    [now, scrimId]
                );
            } catch (updateError) {
                console.error('[Scrim Toggle] Update error:', updateError);
                return NextResponse.json({ error: 'Failed to update scrim' }, { status: 500 });
            }

            // 2. Close the registration channel (deny send_messages for @everyone)
            try {
                // Get current overwrites
                const channelRes = await fetch(`https://discord.com/api/v10/channels/${scrim.registration_channel_id}`, {
                    headers: { 'Authorization': `Bot ${botToken}` },
                });
                if (channelRes.ok) {
                    const openRoleId = scrim.open_role_id || guildId; // @everyone = guild ID
                    await fetch(`https://discord.com/api/v10/channels/${scrim.registration_channel_id}/permissions/${openRoleId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bot ${botToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: openRoleId,
                            type: 0, // role
                            deny: '2048', // SEND_MESSAGES
                            allow: '0',
                        }),
                    });
                }
            } catch (err) {
                console.error('[Scrim Toggle] Channel permission error:', err);
            }

            // 3. Send "Registration Closed" message
            try {
                const closeEmbed = {
                    color: 0xFF0000,
                    description: '**Registration is now Closed!**',
                };
                const msgRes = await fetch(`https://discord.com/api/v10/channels/${scrim.registration_channel_id}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${botToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ embeds: [closeEmbed] }),
                });
                if (!msgRes.ok) {
                    const err = await msgRes.text();
                    console.error('[Scrim Toggle CLOSE] Message failed:', msgRes.status, err);
                }
            } catch (err) {
                console.error('[Scrim Toggle CLOSE] Message error:', err);
            }

            return NextResponse.json({ status: 'closed', message: 'Registration closed' });

        } else {
            // OPEN registration
            // 1. Clear old slots
            const [oldSlotJoins] = await db.query<any[]>(
                `SELECT assignedslot_id FROM \`sm.scrims_sm.assigned_slots\` WHERE \`sm.scrims_id\` = ?`,
                [scrimId]
            );

            if (oldSlotJoins && oldSlotJoins.length > 0) {
                const oldSlotIds = oldSlotJoins.map((j: any) => j.assignedslot_id);
                const placeholders = oldSlotIds.map(() => '?').join(',');
                await db.query(`DELETE FROM \`sm.assigned_slots\` WHERE id IN (${placeholders})`, oldSlotIds);
                await db.query(`DELETE FROM \`sm.scrims_sm.assigned_slots\` WHERE \`sm.scrims_id\` = ?`, [scrimId]);
            }

            // 2. Update scrim: set opened_at, clear closed_at, reset available_slots
            const availableSlots = Array.from({ length: scrim.total_slots }, (_, i) => i + (scrim.start_from || 1));
            try {
                // MySQL JSON serialization for available_slots
                await db.query(
                    `UPDATE \`sm.scrims\` SET opened_at = ?, closed_at = NULL, slotlist_message_id = NULL, available_slots = ? WHERE id = ?`,
                    [now, JSON.stringify(availableSlots), scrimId]
                );
            } catch (updateError) {
                console.error('[Scrim Toggle] Update error:', updateError);
                return NextResponse.json({ error: 'Failed to update scrim' }, { status: 500 });
            }

            // 3. Open the registration channel (allow send_messages for @everyone)
            try {
                const openRoleId = scrim.open_role_id || guildId;
                await fetch(`https://discord.com/api/v10/channels/${scrim.registration_channel_id}/permissions/${openRoleId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bot ${botToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: openRoleId,
                        type: 0,
                        allow: '2048', // SEND_MESSAGES
                        deny: '0',
                    }),
                });
            } catch (err) {
                console.error('[Scrim Toggle] Channel permission error:', err);
            }

            // 4. Send "Registration Open" message
            try {
                const pingContent = scrim.ping_role_id ? `<@&${scrim.ping_role_id}>` : '';
                const openEmbed = {
                    color: 0x00FFB3,
                    title: 'Registration is now open!',
                    description: `📣 **\`${scrim.required_mentions}\`** mentions required.\n📣 Total slots: **\`${scrim.total_slots}\`**`,
                };
                const msgRes = await fetch(`https://discord.com/api/v10/channels/${scrim.registration_channel_id}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${botToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: pingContent || undefined,
                        embeds: [openEmbed],
                        allowed_mentions: { roles: scrim.ping_role_id ? [scrim.ping_role_id] : [] },
                    }),
                });
                if (!msgRes.ok) {
                    const err = await msgRes.text();
                    console.error('[Scrim Toggle OPEN] Message failed:', msgRes.status, err);
                }
            } catch (err) {
                console.error('[Scrim Toggle OPEN] Message error:', err);
            }

            return NextResponse.json({ status: 'opened', message: 'Registration opened' });
        }

    } catch (error) {
        console.error('Error toggling scrim:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
