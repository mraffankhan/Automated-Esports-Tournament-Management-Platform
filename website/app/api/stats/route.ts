import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // Get total commands from database
        const [commandsResult] = await db.query<any>('SELECT COUNT(*) as count FROM commands');

        // Fetch total guilds and user counts from Discord API using Bot Token
        const botToken = process.env.DISCORD_BOT_TOKEN;
        let totalUsers = 0;
        let totalServers = 0;

        if (botToken) {
            try {
                const botGuildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds?with_counts=true', {
                    headers: { 'Authorization': `Bot ${botToken}` },
                    next: { revalidate: 300 } // Cache for 5 minutes to avoid ratelimits
                });
                if (botGuildsRes.ok) {
                    const botGuildsList = await botGuildsRes.json();
                    totalServers = botGuildsList.length;
                    totalUsers = botGuildsList.reduce((acc: number, guild: any) => acc + (guild.approximate_member_count || 0), 0);
                }
            } catch (err) {
                console.error('Error fetching bot guilds for stats:', err);
            }
        }

        // Fallback to database if Discord API fails
        if (totalServers === 0) {
            const [serversResult] = await db.query<any>('SELECT COUNT(*) as count FROM guild_data');
            totalServers = serversResult[0].count;
        }

        return NextResponse.json({
            commands: commandsResult[0].count,
            users: totalUsers,
            servers: totalServers,
            uptime: "99.9%"
        });
    } catch (error) {
        console.error('Error fetching global stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
