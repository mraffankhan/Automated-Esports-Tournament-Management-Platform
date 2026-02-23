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

        const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            headers: { 'Authorization': `Bot ${botToken}` },
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch roles' }, { status: res.status });
        }

        const roles: any[] = await res.json();

        // Sort by position descending, filter out managed (bot) roles
        const filtered = roles
            .filter((r: any) => !r.managed)
            .sort((a: any, b: any) => b.position - a.position)
            .map((r: any) => ({
                id: r.id,
                name: r.name,
                color: r.color,
                position: r.position,
            }));

        return NextResponse.json({ roles: filtered });

    } catch (error) {
        console.error('Error fetching roles:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
