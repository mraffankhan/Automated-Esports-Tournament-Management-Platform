import { NextResponse } from 'next/server';
import { sessionConfig } from '@/lib/session';

export async function POST() {
    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionConfig.name, '', {
        ...sessionConfig.options,
        expires: new Date(0)
    });
    return response;
}
