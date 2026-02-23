import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
        const { data: guild, error: guildError } = await supabase
            .from('guild_data')
            .select('is_premium, premium_end_time, made_premium_by')
            .eq('guild_id', guildId)
            .single();

        if (guildError && guildError.code !== 'PGRST116') { // Ignore "not found"
            console.error('Error fetching guild premium:', guildError);
        }

        // 2. Fetch Premium Plans
        const { data: plans, error: plansError } = await supabase
            .from('premium_plans')
            .select('*')
            .order('price', { ascending: true });

        if (plansError) {
            console.error('Error fetching premium plans:', plansError);
        }

        // 3. Fetch User Premium Status
        let userData = null;
        if (userId) {
            const { data: user, error: userError } = await supabase
                .from('user_data')
                .select('is_premium, premium_expire_time')
                .eq('user_id', userId)
                .single();

            if (!userError) userData = user;
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
