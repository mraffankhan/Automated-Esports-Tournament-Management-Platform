import { NextResponse } from 'next/server';

const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1470031097357140063';
const DISCORD_OAUTH_URL = 'https://discord.com/api/oauth2/authorize';
const REDIRECT_URI = process.env.NODE_ENV === 'production'
    ? 'https://ravonixx.xyz/api/auth/callback'
    : 'http://localhost:3000/api/auth/callback';

export async function GET() {
    const scope = encodeURIComponent('identify guilds email guilds.join');
    const redirectUri = encodeURIComponent(REDIRECT_URI);

    const authUrl = `${DISCORD_OAUTH_URL}?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

    return NextResponse.redirect(authUrl);
}
