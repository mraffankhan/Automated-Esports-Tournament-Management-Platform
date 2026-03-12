import { NextRequest, NextResponse } from 'next/server';
import { createSession, sessionConfig } from '@/lib/session';

export async function GET(req: NextRequest) {
    const DISCORD_CLIENT_ID = (process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1470031097357140063').trim();
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET?.trim();
    const REDIRECT_URI = process.env.NODE_ENV === 'production'
        ? 'https://ravonixx.xyz/api/auth/callback'
        : 'http://localhost:3000/api/auth/callback';

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/?error=access_denied', req.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/?error=no_code', req.url));
    }

    if (!DISCORD_CLIENT_SECRET) {
        console.error('DISCORD_CLIENT_SECRET is missing!');
        return NextResponse.redirect(new URL('/?error=server_configuration', req.url));
    }

    try {
        console.log('--- DEBUGGING OAUTH ---');
        console.log('Client ID:', DISCORD_CLIENT_ID);
        console.log('Client Secret Length:', DISCORD_CLIENT_SECRET?.length || 0);
        console.log('Redirect URI:', REDIRECT_URI);

        // 1. Exchange the authorization code for an access token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET as string,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const errData = await tokenResponse.json();
            console.error('Failed to get token:', errData);
            const errReason = errData.error_description || errData.error || 'unknown_error';
            return NextResponse.redirect(new URL(`/?error=auth_failed&reason=${encodeURIComponent(errReason)}`, req.url));
        }

        const tokenData = await tokenResponse.json();
        const { access_token, expires_in } = tokenData;

        // 2. Fetch the user's profile from Discord
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        if (!userResponse.ok) {
            console.error('Failed to fetch user profile');
            return NextResponse.redirect(new URL('/?error=profile_failed', req.url));
        }

        const userData = await userResponse.json();

        // 3. Create our session
        const avatarUrl = userData.avatar
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator || '0') % 5}.png`;

        console.log('--- USER DATA FROM DISCORD ---');
        console.log(JSON.stringify(userData, null, 2));

        const { session, expires } = await createSession({
            user: {
                id: userData.id || 'unknown_id',
                username: userData.username || 'UnknownUser',
                avatar: avatarUrl,
                email: userData.email,
                global_name: userData.global_name || userData.username || 'Unknown',
            },
            accessToken: access_token,
            expiresAt: Date.now() + expires_in * 1000,
        });

        // 4. Redirect the user back to the application
        const response = NextResponse.redirect(new URL('/servers', req.url));
        response.cookies.set(sessionConfig.name, session, {
            ...sessionConfig.options,
            expires
        });

        return response;

    } catch (err) {
        console.error('OAuth Callback Error:', err);
        return NextResponse.redirect(new URL('/?error=internal_server_error', req.url));
    }
}
