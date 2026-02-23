import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Discord permission flags
const ADMINISTRATOR = 0x8;
const MANAGE_GUILD = 0x20;

export async function POST(req: NextRequest) {
    try {
        const { accessToken } = await req.json();

        if (!accessToken) {
            return NextResponse.json({ error: 'Missing accessToken' }, { status: 400 });
        }

        // 1. Fetch user's guilds from Discord API (with rate limit retry)
        let discordRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        // Retry once if rate limited
        if (discordRes.status === 429) {
            const retryBody = await discordRes.json().catch(() => ({}));
            const waitMs = (retryBody.retry_after || 1) * 1000 + 200;
            console.log(`[Guilds] Rate limited, retrying after ${waitMs}ms`);
            await new Promise(r => setTimeout(r, waitMs));
            discordRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
        }

        if (!discordRes.ok) {
            const errData = await discordRes.json().catch(() => ({}));
            console.error('Discord API error:', discordRes.status, errData);
            return NextResponse.json(
                { error: 'Failed to fetch guilds from Discord', details: errData },
                { status: discordRes.status }
            );
        }

        const allGuilds: any[] = await discordRes.json();

        // 2. Filter to guilds where user is Owner, Administrator, or has Manage Server
        const manageableGuilds = allGuilds.filter((g: any) => {
            if (g.owner) return true;
            const perms = parseInt(g.permissions);
            return (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;
        });

        if (manageableGuilds.length === 0) {
            return NextResponse.json([]);
        }

        // 3. Check which of these guilds the bot is in
        // Strategy: Use Discord Bot API to get bot's guilds (reliable), then enrich with Supabase data
        const botToken = process.env.DISCORD_BOT_TOKEN;

        // 3a. Get bot's guild list from Discord API
        let botGuildIds = new Set<string>();
        if (botToken) {
            try {
                const botGuildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
                    headers: { 'Authorization': `Bot ${botToken}` },
                });
                if (botGuildsRes.ok) {
                    const botGuilds: any[] = await botGuildsRes.json();
                    botGuildIds = new Set(botGuilds.map((g: any) => g.id));
                }
            } catch (err) {
                console.error('Error fetching bot guilds:', err);
            }
        }

        // 3b. Also check Supabase for premium/prefix data
        const guildIds = manageableGuilds.map((g: any) => g.id);
        let botGuildsData: any[] = [];
        try {
            const { data, error } = await supabase
                .from('guild_data')
                .select('guild_id, is_premium, prefix')
                .in('guild_id', guildIds);

            if (error) {
                console.error('Supabase guild_data error:', error);
            } else {
                botGuildsData = data || [];
            }
        } catch (err) {
            console.error('Supabase fetch error:', err);
        }

        // 4. Merge and return
        const merged = manageableGuilds.map((guild: any) => {
            const botData = botGuildsData.find((bg: any) => String(bg.guild_id) === guild.id);
            const perms = parseInt(guild.permissions);

            let role = 'Admin';
            if (guild.owner) {
                role = 'Owner';
            } else if ((perms & ADMINISTRATOR) === ADMINISTRATOR) {
                role = 'Admin';
            } else if ((perms & MANAGE_GUILD) === MANAGE_GUILD) {
                role = 'Manager';
            }

            return {
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                role,
                has_bot: botGuildIds.has(guild.id),
                is_premium: botData?.is_premium || false,
                prefix: botData?.prefix || 'a',
            };
        });

        // Sort: has_bot first, then by name
        merged.sort((a: any, b: any) => {
            if (a.has_bot !== b.has_bot) return a.has_bot ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json(merged);

    } catch (error) {
        console.error('Error in /api/discord/guilds:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
