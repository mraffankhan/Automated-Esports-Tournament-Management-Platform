import { NextRequest, NextResponse } from 'next/server';

const DEVS = ["1449081308616720628"];

export async function POST(req: NextRequest) {
    try {
        const { userId, accessToken, guildId: requestedGuildId } = await req.json();

        if (!userId || !accessToken) {
            return NextResponse.json({ error: 'Missing userId or accessToken' }, { status: 400 });
        }

        const botToken = process.env.DISCORD_BOT_TOKEN;
        const defaultGuildId = process.env.NEXT_PUBLIC_SUPPORT_SERVER_ID;

        // If a custom guildId is requested, only allow for devs
        const guildId = requestedGuildId || defaultGuildId;

        if (requestedGuildId && requestedGuildId !== defaultGuildId) {
            if (!DEVS.includes(userId)) {
                return NextResponse.json({ error: 'Unauthorized: Only developers can join arbitrary servers' }, { status: 403 });
            }
        }

        if (!botToken || !guildId) {
            console.error('Missing Bot Token or Guild ID');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                access_token: accessToken,
            }),
        });

        if (response.ok || response.status === 201 || response.status === 204) {
            return NextResponse.json({ success: true });
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Discord join error:', response.status, JSON.stringify(errorData));
            const detail = errorData.message || errorData.code || 'Unknown Discord error';
            return NextResponse.json({
                success: false,
                error: `Discord API error (${response.status}): ${detail}`
            });
        }

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
