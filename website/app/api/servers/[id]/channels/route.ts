import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guildId } = await params;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
        }

        // Fetch channels from the guild via Discord Bot API
        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
            headers: {
                'Authorization': `Bot ${botToken}`,
            },
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('Discord channels error:', response.status, err);
            return NextResponse.json({ error: 'Failed to fetch channels' }, { status: response.status });
        }

        const allChannels: any[] = await response.json();

        // Filter to text channels only (type 0 = GUILD_TEXT)
        const textChannels = allChannels
            .filter((c: any) => c.type === 0)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                category: c.parent_id,
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));

        // Also get categories for grouping
        const categories = allChannels
            .filter((c: any) => c.type === 4)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
            }));

        return NextResponse.json({ channels: textChannels, categories });

    } catch (error) {
        console.error('Error fetching channels:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
