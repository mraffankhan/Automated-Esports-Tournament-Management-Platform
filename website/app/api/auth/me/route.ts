import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 200 });
        }

        return NextResponse.json({
            authenticated: true,
            user: session.user,
        });
    } catch (error) {
        console.error('Auth/me Error:', error);
        return NextResponse.json({ authenticated: false, error: 'Failed to authenticate session' }, { status: 500 });
    }
}
