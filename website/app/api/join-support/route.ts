import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { userId, accessToken } = await req.json();

        if (!userId || !accessToken) {
            return NextResponse.json({ error: 'Missing userId or accessToken' }, { status: 400 });
        }

        const botToken = process.env.DISCORD_BOT_TOKEN;
        const guildId = process.env.NEXT_PUBLIC_SUPPORT_SERVER_ID;

        if (!botToken || !guildId) {
            console.error('Missing Bot Token or Guild ID');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Add user to guild
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
            console.error('Discord API Error:', response.status, errorData);
            return NextResponse.json({ error: 'Failed to join server', details: errorData }, { status: response.status });
        }

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
