"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, User, LogIn, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setLoading(false);

            if (session?.user && session?.provider_token) {
                // Trigger auto-join
                try {
                    await fetch('/api/join-support', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: session.user.user_metadata.provider_id,
                            accessToken: session.provider_token
                        })
                    });
                } catch (e) {
                    console.error("Auto-join error", e);
                }
            }
        };

        handleAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user || null);
            if (session?.user && session?.provider_token && _event === 'SIGNED_IN') {
                // Trigger auto-join on sign in
                try {
                    await fetch('/api/join-support', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: session.user.user_metadata.provider_id,
                            accessToken: session.provider_token
                        })
                    });
                } catch (e) {
                    console.error("Auto-join error", e);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsOpen(false);
    };

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: `${window.location.origin}/profile`,
                scopes: 'guilds.join identify email',
            },
        });
    };

    return (
        <>
            <nav className="fixed top-6 left-0 right-0 mx-auto w-[95%] max-w-7xl z-50 bg-black/80 backdrop-blur-md border border-cyan-500/20 rounded-full px-6 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:text-glow transition-all">
                            POTATO
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8 items-center">
                            <NavLink href="/">HOME</NavLink>
                            <NavLink href="/tournaments">TOURNAMENTS</NavLink>
                            <NavLink href="/get">GET</NavLink>

                            {loading ? (
                                <div className="h-10 w-10 flex items-center justify-center">
                                    <Loader2 size={20} className="text-cyan-400 animate-spin" />
                                </div>
                            ) : user ? (
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all hover:text-glow hover:border-cyan-500/60 group"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500/50">
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt="User"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="text-sm font-bold truncate max-w-[100px]">
                                        {user.user_metadata.full_name?.split(' ')[0] || "User"}
                                    </span>
                                </Link>
                            ) : (
                                <button
                                    onClick={handleLogin}
                                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                >
                                    <LogIn size={16} />
                                    <span>LOGIN</span>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsOpen(true)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-full text-cyan-400 hover:text-white hover:bg-cyan-500/20 focus:outline-none transition-colors"
                        >
                            <span className="sr-only">Open main menu</span>
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Full Screen Mobile Menu */}
            <div className={`fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}>
                <div className="flex flex-col h-full">
                    <div className="flex justify-end p-6">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-full text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-colors"
                        >
                            <X size={32} />
                        </button>
                    </div>
                    <div className="flex flex-col items-center justify-center flex-grow space-y-8">
                        <MobileNavLink href="/" onClick={() => setIsOpen(false)}>HOME</MobileNavLink>
                        <MobileNavLink href="/tournaments" onClick={() => setIsOpen(false)}>TOURNAMENTS</MobileNavLink>
                        <MobileNavLink href="/get" onClick={() => setIsOpen(false)}>GET</MobileNavLink>

                        {user ? (
                            <div className="flex flex-col items-center gap-4 mt-8">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="User"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-2xl font-bold text-white mb-2">
                                    {user.user_metadata.full_name}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition-all"
                                >
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setIsOpen(false); handleLogin(); }}
                                className="mt-8 flex items-center gap-3 px-8 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                            >
                                <LogIn size={24} />
                                <span>LOGIN NOW</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="text-gray-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors hover:text-glow relative group"
        >
            {children}
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        </Link>
    );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="text-3xl font-bold text-gray-300 hover:text-cyan-400 transition-colors hover:text-glow"
        >
            {children}
        </Link>
    );
}
