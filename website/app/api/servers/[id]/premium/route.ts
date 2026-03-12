import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: guildId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    try {
        // Try cache first
        let cached = null;
        try {
            const cacheKey = `premium_data:${guildId}:${userId || 'anon'}`;
            const cachedData = await redis.get(cacheKey);
            if (cachedData) cached = JSON.parse(cachedData);
        } catch (e) {
            console.warn("Redis cache read failed:", e);
        }

        if (cached) {
            return NextResponse.json(cached);
        }

        // 1. Fetch Guild Premium Status
        const [guildRows] = await db.query<any[]>(
            `SELECT is_premium, premium_end_time, made_premium_by FROM \`guild_data\` WHERE guild_id = ?`,
            [guildId]
        );
        const guild = guildRows[0] || null;

        // 2. Fetch Premium Plans
        const [plans] = await db.query<any[]>(
            `SELECT * FROM \`premium_plans\` ORDER BY price ASC`
        );

        // 3. Fetch User Premium Status
        let userData = null;
        if (userId) {
            const [userRows] = await db.query<any[]>(
                `SELECT is_premium, premium_expire_time FROM \`user_data\` WHERE user_id = ?`,
                [userId]
            );
            if (userRows.length > 0) userData = userRows[0];
        }

        const response = {
            guild: guild || { is_premium: false, premium_end_time: null, made_premium_by: null },
            user: userData || { is_premium: false, premium_expire_time: null },
            plans: plans || []
        };

        // Cache for 1 minute
        const cacheKey = `premium_data:${guildId}:${userId || 'anon'}`;
        redis.setex(cacheKey, 60, JSON.stringify(response)).catch(err => console.warn("Redis write failed:", err));

        return NextResponse.json(response);
    } catch (error) {
        console.error("Premium fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch premium data" }, { status: 500 });
    }
}
