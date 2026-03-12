"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Loader2, Shield, Server, Crown, ShieldCheck, Settings2, Users, Info, X, Hash, LogIn } from "lucide-react";
import Link from "next/link";

interface Guild {
    id: string;
    name: string;
    icon: string | null;
    role: string;
    has_bot: boolean;
    is_premium: boolean;
    prefix: string;
    member_count: number;
}

const DEVS = ["1449081308616720628"];

export default function ServersPage() {
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDev, setIsDev] = useState(false);
    const [joiningGuild, setJoiningGuild] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const loadGuilds = async () => {
            try {
                // First get user session
                const sessionRes = await fetch('/api/auth/me');
                if (!sessionRes.ok) {
                    if (isMounted) {
                        setLoading(false);
                    }
                    return;
                }

                const sessionData = await sessionRes.json();
                if (!sessionData.authenticated) {
                    if (isMounted) setLoading(false);
                    return;
                }

                if (isMounted) {
                    setUser(sessionData.user);
                    if (DEVS.includes(sessionData.user.id)) {
                        setIsDev(true);
                    }
                }

                // Fetch servers 
                const fetchServers = async (retries = 2): Promise<void> => {
                    try {
                        // NOTE: Backend now extracts accessToken from the session cookie
                        // No need to pass it in the body.
                        const response = await fetch("/api/discord/guilds", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({}),
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (isMounted) setGuilds(data.filter((g: Guild) => g.has_bot));
                        } else if (response.status === 429 && retries > 0) {
                            const body = await response.json().catch(() => ({}));
                            const delay = (body.details?.retry_after || 1) * 1000 + 500;
                            await new Promise(r => setTimeout(r, delay));
                            return fetchServers(retries - 1);
                        } else if (response.status === 401) {
                            if (isMounted) setError("Session expired. Please log out and log in again.");
                        } else {
                            if (isMounted) setError("Failed to fetch servers. Try logging in again.");
                        }
                    } catch (err) {
                        if (isMounted) setError("Network error. Please try again.");
                    }
                };

                await fetchServers();
            } catch (err) {
                console.error("Failed to load user or servers", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadGuilds();
        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-gray-400 text-sm animate-pulse">Loading your servers...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4 px-4">
                <Shield size={48} className="text-red-400" />
                <p className="text-red-400 text-center max-w-md">{error}</p>
                <button
                    onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        router.push("/");
                    }}
                    className="px-6 py-2 bg-primary hover:bg-primary/80 text-black font-bold rounded-lg transition-all"
                >
                    Log In Again
                </button>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-6 px-4 text-center">
                <div className="p-6 bg-white/5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    <Shield size={48} className="text-primary" />
                </div>
                <div className="max-w-md space-y-2">
                    <h1 className="text-2xl font-bold text-white">Login Required</h1>
                    <p className="text-gray-400">
                        You need to be logged in to manage your servers and access the dashboard.
                    </p>
                </div>
                <button
                    onClick={() => {
                        window.location.href = '/api/auth/discord';
                    }}
                    className="px-8 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current">
                        <path d="M20.317 4.36982C18.798 3.66982 17.218 3.16982 15.558 2.99982C15.558 2.99982 15.288 3.47982 15.088 3.94982C13.258 3.67982 11.438 3.67982 9.618 3.94982C9.428 3.47982 9.148 2.99982 9.148 2.99982C7.488 3.16982 5.908 3.66982 4.378 4.36982C1.298 8.92982 0.448 13.3698 0.858 17.7498C2.918 19.2698 4.908 20.1998 6.858 20.7898C7.338 20.1498 7.768 19.4598 8.138 18.7298C7.428 18.4598 6.758 18.1298 6.118 17.7398C6.288 17.6098 6.458 17.4798 6.618 17.3398C10.158 18.9698 14.548 18.9698 18.068 17.3398C18.238 17.4798 18.398 17.6098 18.578 17.7398C17.938 18.1298 17.268 18.4598 16.558 18.7298C16.928 19.4598 17.368 20.1498 17.848 20.7898C19.798 20.1998 21.788 19.2698 23.848 17.7498C24.368 12.5998 23.018 8.16982 20.317 4.36982ZM8.518 15.2498C7.268 15.2498 6.248 14.0998 6.248 12.6998C6.248 11.2998 7.258 10.1498 8.518 10.1498C9.788 10.1498 10.808 11.2998 10.778 12.6998C10.778 14.0998 9.778 15.2498 8.518 15.2498ZM16.178 15.2498C14.928 15.2498 13.908 14.0998 13.908 12.6998C13.908 11.2998 14.918 10.1498 16.178 10.1498C17.448 10.1498 18.468 11.2998 18.438 12.6998C18.438 14.0998 17.438 15.2498 16.178 15.2498Z" />
                    </svg>
                    Login with Discord
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Server className="text-primary" size={28} />
                            My <span className="text-primary">Servers</span>
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Servers where Argon is active and you have admin permissions
                        </p>
                    </div>
                    <span className="text-gray-400 text-sm hidden sm:block">
                        Logged in as <span className="text-white font-bold">{user?.global_name || user?.username}</span>
                    </span>
                </div>

                {/* Guild Grid */}
                {guilds.length === 0 ? (
                    <div className="text-center py-20 bg-primary/5 rounded-2xl border border-primary/20">
                        <Shield size={64} className="mx-auto text-primary/50 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">No Servers Found</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                            Argon is not in any of your admin servers. Add the bot to a server first.
                        </p>
                        <a
                            href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "1470031097357140063"}&permissions=8&integration_type=0&scope=applications.commands+bot`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-6 px-6 py-3 bg-primary hover:bg-primary/80 text-black font-bold rounded-lg transition-all"
                        >
                            Add Argon to a Server
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {guilds.map((guild, index) => (
                            <div
                                key={guild.id}
                                className="bg-primary/5 border border-primary/20 rounded-xl p-6 hover:border-primary/50 transition-all hover:-translate-y-1 group relative overflow-hidden animate-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Premium badge */}
                                {guild.is_premium && (
                                    <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-yellow-500/30 flex items-center gap-1">
                                        <Crown size={12} />
                                        <span>PREMIUM</span>
                                    </div>
                                )}

                                {/* Server Info */}
                                <div className="flex items-center gap-4 mb-4">
                                    {guild.icon ? (
                                        <img
                                            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                            alt={guild.name}
                                            className="w-16 h-16 rounded-full border-2 border-primary/30 group-hover:border-primary/80 transition-colors"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary border-2 border-primary/30">
                                            {guild.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-white truncate" title={guild.name}>
                                            {guild.name}
                                        </h3>
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${guild.role === 'Owner'
                                                ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                                                : 'text-primary/80 bg-primary/10 border-primary/20'
                                                }`}>
                                                {guild.role === 'Owner' && <Crown size={10} className="inline mr-1 -mt-0.5" />}
                                                {guild.role === 'Admin' && <ShieldCheck size={10} className="inline mr-1 -mt-0.5" />}
                                                {guild.role}
                                            </span>
                                            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                                Active
                                            </span>
                                            <span className="text-xs text-gray-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                                                <Users size={10} />
                                                {guild.member_count.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Manage Button */}
                                <div className="flex gap-2 mt-4">
                                    <Link
                                        href={`/servers/${guild.id}`}
                                        className="flex-1 flex bg-primary hover:bg-primary/80 text-black font-bold py-2.5 rounded-lg text-sm transition-all items-center justify-center gap-2 hover:shadow-[0_0_15px_var(--color-primary-glow)]"
                                    >
                                        <Settings2 size={16} />
                                        Manage
                                    </Link>
                                    {isDev && (
                                        <button
                                            onClick={async () => {
                                                setJoiningGuild(guild.id);
                                                try {
                                                    const userId = user?.id;
                                                    if (!userId) {
                                                        alert('Missing access token or user ID. Please re-login.');
                                                        return;
                                                    }
                                                    const res = await fetch('/api/join-support', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ userId, guildId: guild.id }),
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert(`Successfully joined ${guild.name}!`);
                                                    } else {
                                                        alert(data.error || 'Failed to join server.');
                                                    }
                                                } catch (err) {
                                                    alert('Error joining server.');
                                                } finally {
                                                    setJoiningGuild(null);
                                                }
                                            }}
                                            disabled={joiningGuild === guild.id}
                                            className="flex-none flex bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 font-bold py-2.5 px-3 rounded-lg transition-all items-center justify-center border border-green-500/20 hover:border-green-500/40 active:scale-95 disabled:opacity-50"
                                            title="Join this server (Dev)"
                                        >
                                            {joiningGuild === guild.id ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedGuild(guild)}
                                        className="flex-none flex bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold py-2.5 px-3 rounded-lg transition-all items-center justify-center border border-white/10"
                                        title="Server Info"
                                    >
                                        <Info size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Server Info Modal */}
            {selectedGuild && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Info className="text-primary" size={24} />
                                Server Info
                            </h2>
                            <button
                                onClick={() => setSelectedGuild(null)}
                                className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                                {selectedGuild.icon ? (
                                    <img
                                        src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png?size=1024`}
                                        alt={selectedGuild.name}
                                        className="w-20 h-20 rounded-xl border border-white/10 shadow-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-xl bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary border border-primary/30 shadow-lg">
                                        {selectedGuild.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-tight">{selectedGuild.name}</h3>
                                    <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
                                        <Hash size={14} className="text-primary/70" />
                                        {selectedGuild.id}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                                    <div className="text-gray-500 text-xs font-bold mb-1 uppercase">Members</div>
                                    <div className="text-white font-medium flex items-center gap-1.5">
                                        <Users size={14} className="text-gray-400" />
                                        {selectedGuild.member_count.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                                    <div className="text-gray-500 text-xs font-bold mb-1 uppercase">Your Role</div>
                                    <div className="text-white font-medium flex items-center gap-1.5">
                                        <ShieldCheck size={14} className={selectedGuild.role === 'Owner' ? "text-yellow-400" : "text-primary"} />
                                        {selectedGuild.role}
                                    </div>
                                </div>
                                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                                    <div className="text-gray-500 text-xs font-bold mb-1 uppercase">Premium</div>
                                    <div className="text-white font-medium flex items-center gap-1.5">
                                        <Crown size={14} className={selectedGuild.is_premium ? "text-yellow-400" : "text-gray-500"} />
                                        {selectedGuild.is_premium ? "Active" : "None"}
                                    </div>
                                </div>
                                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                                    <div className="text-gray-500 text-xs font-bold mb-1 uppercase">Prefix</div>
                                    <div className="text-white font-medium flex items-center gap-1.5">
                                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-primary">{selectedGuild.prefix}</code>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/50 border border-white/5 rounded-xl p-3 mt-4">
                                <div className="text-gray-500 text-xs font-bold mb-1 uppercase">Bot Status</div>
                                <div className="text-white font-medium flex items-center gap-1.5">
                                    {selectedGuild.has_bot ? (
                                        <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> Connected</>
                                    ) : (
                                        <><span className="w-2 h-2 bg-red-500 rounded-full"></span> Disconnected</>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
