import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'super_secret_fallback_key_for_development';
const key = new TextEncoder().encode(secretKey);

export type User = {
    id: string;
    username: string;
    avatar: string | null;
    email?: string;
    global_name?: string | null;
};

export interface SessionPayload {
    user: User;
    accessToken: string;
    expiresAt: number;
}

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(key);
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        });
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}

export const sessionConfig = {
    name: 'session',
    options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
    }
};

export async function createSession(sessionData: SessionPayload) {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await encrypt(sessionData);

    // Provide a helper to just set the cookie if needed, but return the token so routes can set it on the response
    const cookieStore = await cookies();
    cookieStore.set(sessionConfig.name, session, {
        ...sessionConfig.options,
        expires: expires,
    });

    return { session, expires };
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get(sessionConfig.name)?.value;
    if (!session) return null;
    return await decrypt(session);
}

export async function destroySession() {
    const cookieStore = await cookies();
    cookieStore.set(sessionConfig.name, '', {
        ...sessionConfig.options,
        expires: new Date(0), // Expire immediately
    });
}
