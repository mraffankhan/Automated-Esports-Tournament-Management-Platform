"use client";

import { useEffect, useState, use } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Loader2, ArrowLeft, Trophy, Plus, X, Hash,
    Users, MessageSquare, Shield, CheckCircle2, AlertCircle,
    Swords, Clock, Sparkles, Star, Crown, Ticket, Lock, Unlock
} from "lucide-react";

interface Channel {
    id: string;
    name: string;
    category: string | null;
}

interface Role {
    id: string;
    name: string;
    color: number;
}

interface Tournament {
    id: number;
    name: string;
    registration_channel_id: string;
    confirm_channel_id: string;
    total_slots: number;
    required_mentions: number;
    started_at: string | null;
    closed_at: string | null;
}

interface Scrim {
    id: string;
    name: string;
    registration_channel_id: string;
    total_slots: number;
    open_time: string;
    opened_at: string | null;
    closed_at: string | null;
    stoggle: boolean;
}

interface Plan {
    id: number;
    name: string;
    description: string;
    price: number;
    duration: string;
}

interface TicketItem {
    id: number;
    channel_id: string;
    opener_id: string;
    config_id: number;
    opened_at: string;
    closed_at: string | null;
    closed_by: string | null;
    reason: string | null;
    panel_title: string;
}

interface TicketConfigInfo {
    id: number;
    title: string;
    channel_id: string;
    category_id: string | null;
    support_role_id: string | null;
    log_channel_id: string | null;
    max_tickets: number;
}

interface GuildPremium {
    is_premium: boolean;
    premium_end_time: string | null;
    made_premium_by: string | null;
}

interface UserPremium {
    is_premium: boolean;
    premium_expire_time: string | null;
}

export default function ServerManagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: guildId } = use(params);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [scrims, setScrims] = useState<Scrim[]>([]);
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [ticketConfigs, setTicketConfigs] = useState<TicketConfigInfo[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [guildPremium, setGuildPremium] = useState<GuildPremium | null>(null);
    const [userPremium, setUserPremium] = useState<UserPremium | null>(null);

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"tournaments" | "scrims" | "tickets" | "welcome" | "premium">("tournaments");
    const [closingTicketId, setClosingTicketId] = useState<number | null>(null);
    const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "closed">("all");

    // UI State
    const [showForm, setShowForm] = useState(false);
    const [showScrimForm, setShowScrimForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Tournament Form
    const [formName, setFormName] = useState("");
    const [formRegChannel, setFormRegChannel] = useState("");
    const [formConfirmChannel, setFormConfirmChannel] = useState("");
    const [formSlots, setFormSlots] = useState(16);
    const [formMentions, setFormMentions] = useState(4);
    const [formPingRole, setFormPingRole] = useState("");

    // Scrim Form
    const [scrimName, setScrimName] = useState("Daily Scrims");
    const [scrimRegChannel, setScrimRegChannel] = useState("");
    const [scrimSlotChannel, setScrimSlotChannel] = useState("");
    const [scrimSlots, setScrimSlots] = useState(20);
    const [scrimMentions, setScrimMentions] = useState(4);
    const [scrimPingRole, setScrimPingRole] = useState("");
    const [scrimTime, setScrimTime] = useState("14:00");

    const router = useRouter();

    useEffect(() => {
        let isMounted = true;
        let loaded = false;

        const loadData = async (session: any) => {
            if (!isMounted || loaded) return;
            loaded = true;
            setUser(session.user);

            // Fetch all data in parallel
            const [tourneysRes, scrimsRes, channelsRes, rolesRes, premiumRes, ticketsRes] = await Promise.all([
                fetch(`/api/servers/${guildId}/tournaments`),
                fetch(`/api/servers/${guildId}/scrims`),
                fetch(`/api/servers/${guildId}/channels`),
                fetch(`/api/servers/${guildId}/roles`),
                fetch(`/api/servers/${guildId}/premium?userId=${session.user.id}`),
                fetch(`/api/servers/${guildId}/tickets`),
            ]);

            if (tourneysRes.ok && isMounted) setTournaments(await tourneysRes.json());
            if (scrimsRes.ok && isMounted) setScrims(await scrimsRes.json());
            if (channelsRes.ok && isMounted) {
                const data = await channelsRes.json();
                setChannels(data.channels || []);
            }
            if (rolesRes.ok && isMounted) {
                const data = await rolesRes.json();
                setRoles(data.roles || []);
            }
            if (premiumRes.ok && isMounted) {
                const data = await premiumRes.json();
                setGuildPremium(data.guild);
                setUserPremium(data.user);
                setPlans(data.plans || []);
            }
            if (ticketsRes.ok && isMounted) {
                const data = await ticketsRes.json();
                setTickets(data.tickets || []);
                setTicketConfigs(data.configs || []);
            }

            if (isMounted) setLoading(false);
        };

        // Check initial session
        const fetchSession = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated && data.user) {
                        if (isMounted) loadData(data); // data has .user, which loadData expects inside session.user
                        return;
                    }
                }
                if (isMounted) setLoading(false);
            } catch (err) {
                if (isMounted) setLoading(false);
            }
        };

        fetchSession();

        return () => { isMounted = false; };
    }, [guildId, router]);

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const handleCreateTournament = async () => {
        if (!formName.trim() || !formRegChannel || !formConfirmChannel || !formSlots) {
            showToast("error", "Please fill all required fields.");
            return;
        }

        if (formRegChannel === formConfirmChannel) {
            showToast("error", "Registration and Confirm channels must be different.");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch(`/api/servers/${guildId}/tournaments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName.trim(),
                    registration_channel_id: formRegChannel,
                    confirm_channel_id: formConfirmChannel,
                    total_slots: formSlots,
                    required_mentions: formMentions,
                    ping_role_id: formPingRole || null,
                    host_id: user?.user_metadata?.provider_id,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setTournaments((prev) => [data.tournament, ...prev]);
                setShowForm(false);
                setFormName("");
                setFormRegChannel("");
                setFormConfirmChannel("");
                setFormSlots(16);
                setFormMentions(4);
                showToast("success", `Tournament "${formName}" created successfully!`);
            } else {
                const err = await res.json().catch(() => ({}));
                showToast("error", err.error || "Failed to create tournament.");
            }
        } catch (err) {
            showToast("error", "Network error. Please try again.");
        }
        setCreating(false);
    };

    const handleCreateScrim = async () => {
        if (!scrimName.trim() || !scrimRegChannel || !scrimSlotChannel || !scrimSlots || !scrimTime) {
            showToast("error", "Please fill all required fields.");
            return;
        }

        if (scrimRegChannel === scrimSlotChannel) {
            showToast("error", "Registration and Slotlist channels must be different.");
            return;
        }

        setCreating(true);
        // Calculate next occurrence
        const [hours, minutes] = scrimTime.split(':').map(Number);
        const now = new Date();
        let openTime = new Date();
        openTime.setHours(hours, minutes, 0, 0);
        if (openTime <= now) openTime.setDate(openTime.getDate() + 1);

        try {
            const res = await fetch(`/api/servers/${guildId}/scrims`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: scrimName.trim(),
                    registration_channel_id: scrimRegChannel,
                    slotlist_channel_id: scrimSlotChannel,
                    total_slots: scrimSlots,
                    required_mentions: scrimMentions,
                    ping_role_id: scrimPingRole || null,
                    open_time: openTime.toISOString(),
                    host_id: user?.user_metadata?.provider_id,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setScrims((prev) => [data, ...prev]);
                setShowScrimForm(false);
                setScrimName("Daily Scrims");
                setScrimRegChannel("");
                setScrimSlotChannel("");
                setScrimSlots(20);
                setScrimMentions(4);
                showToast("success", `Scrim "${scrimName}" created successfully!`);
            } else {
                const err = await res.json().catch(() => ({}));
                showToast("error", err.error || "Failed to create scrim.");
            }
        } catch (err) {
            showToast("error", "Network error. Please try again.");
        }
        setCreating(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4 text-white">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-gray-400 text-sm animate-pulse">Loading server dashboard...</p>
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
                        You need to be logged in to access this dashboard.
                    </p>
                </div>
                <button
                    onClick={() => {
                        router.push('/api/auth/discord');
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
        <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-white">
            <div className="max-w-5xl mx-auto">
                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl animate-in ${toast.type === "success"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                        }`}>
                        {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/servers"
                        className="p-2 rounded-lg border border-primary/20 hover:border-primary/50 text-primary hover:bg-primary/10 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">Server Dashboard</h1>
                            {guildPremium?.is_premium && (
                                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 text-yellow-500 border border-yellow-500/30 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                                    <Crown size={12} className="fill-yellow-500" />
                                    PREMIUM
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">Manage tournaments, scrims, tickets, and premium features</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 mb-8 bg-white/5 p-1 rounded-xl w-full max-w-full overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab("tournaments")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "tournaments"
                            ? "bg-primary text-black shadow-lg shadow-primary/20"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <Trophy size={16} />
                        Tournaments
                        <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-full ${activeTab === "tournaments" ? "bg-black/20" : "bg-white/10"}`}>
                            {tournaments.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("scrims")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "scrims"
                            ? "bg-primary text-black shadow-lg shadow-primary/20"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <Swords size={16} />
                        Scrims
                        <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-full ${activeTab === "scrims" ? "bg-black/20" : "bg-white/10"}`}>
                            {scrims.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("tickets")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "tickets"
                            ? "bg-primary text-black shadow-lg shadow-primary/20"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <Ticket size={16} />
                        Tickets
                        <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-full ${activeTab === "tickets" ? "bg-black/20" : "bg-white/10"}`}>
                            {tickets.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("welcome")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "welcome"
                            ? "bg-primary text-black shadow-lg shadow-primary/20"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <MessageSquare size={16} />
                        Welcome Message
                    </button>
                    <button
                        onClick={() => setActiveTab("premium")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "premium"
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/20"
                            : "text-yellow-500 hover:bg-yellow-500/10"
                            }`}
                    >
                        <Sparkles size={16} />
                        Premium
                    </button>
                </div>

                {/* Content Section */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === "tournaments" && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Trophy className="text-primary" size={22} />
                                    Active Tournaments
                                </h2>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-black font-bold rounded-lg text-sm transition-all hover:shadow-[0_0_15px_var(--color-primary-glow)]"
                                >
                                    <Plus size={16} />
                                    Create Tournament
                                </button>
                            </div>

                            {tournaments.length === 0 ? (
                                <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                                    <Trophy size={48} className="mx-auto text-white/20 mb-4" />
                                    <h3 className="text-lg font-bold mb-2">No Tournaments Yet</h3>
                                    <p className="text-gray-500 text-sm">Create your first tournament to get started.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {tournaments.map((t, index) => (
                                        <div
                                            key={t.id}
                                            className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-primary/40 transition-all group"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">{t.name}</h3>
                                                        {t.started_at && !t.closed_at ? (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 shrink-0">
                                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                                                Open
                                                            </span>
                                                        ) : t.closed_at ? (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                                                                Closed
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shrink-0">
                                                                Not Started
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1.5">
                                                            <Users size={14} className="text-primary/60" />
                                                            {t.total_slots} slots
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <MessageSquare size={14} className="text-primary/60" />
                                                            {t.required_mentions} mentions
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Hash size={14} className="text-primary/60" />
                                                            ID: {t.id}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/servers/${guildId}/tournament/${t.id}`}
                                                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-primary hover:text-black font-medium rounded-lg text-sm transition-all"
                                                >
                                                    <Trophy size={14} />
                                                    Manage
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === "scrims" && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Swords className="text-primary" size={22} />
                                    Active Scrims
                                </h2>
                                <button
                                    onClick={() => setShowScrimForm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-black font-bold rounded-lg text-sm transition-all hover:shadow-[0_0_15px_var(--color-primary-glow)]"
                                >
                                    <Plus size={16} />
                                    Create Scrim
                                </button>
                            </div>

                            {scrims.length === 0 ? (
                                <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                                    <Swords size={48} className="mx-auto text-white/20 mb-4" />
                                    <h3 className="text-lg font-bold mb-2">No Scrims Yet</h3>
                                    <p className="text-gray-500 text-sm">Create a scrim to start managing matches.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {scrims.map((s, index) => (
                                        <div
                                            key={s.id}
                                            className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-primary/40 transition-all group"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">{s.name}</h3>
                                                        {!s.stoggle ? (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                                                                Disabled
                                                            </span>
                                                        ) : s.opened_at && (!s.closed_at || s.closed_at < s.opened_at) ? (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 shrink-0">
                                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                                                Registration Open
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                                                                Upcoming
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1.5">
                                                            <Users size={14} className="text-primary/60" />
                                                            {s.total_slots} slots
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock size={14} className="text-primary/60" />
                                                            Opens at {new Date(s.open_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Hash size={14} className="text-primary/60" />
                                                            ID: {s.id}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/servers/${guildId}/scrim/${s.id}`}
                                                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-primary hover:text-black font-medium rounded-lg text-sm transition-all"
                                                >
                                                    <Swords size={14} />
                                                    Manage
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === "tickets" && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Ticket className="text-primary" size={22} />
                                    Support Tickets
                                </h2>
                                <div className="flex items-center gap-2">
                                    {(["all", "open", "closed"] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setTicketFilter(f)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${ticketFilter === f
                                                ? "bg-primary text-black"
                                                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ticket Config Summary */}
                            {ticketConfigs.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                                    {ticketConfigs.map((cfg) => {
                                        const openCount = tickets.filter(t => t.config_id === cfg.id && !t.closed_at).length;
                                        const totalCount = tickets.filter(t => t.config_id === cfg.id).length;
                                        return (
                                            <div key={cfg.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <Ticket size={18} className="text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{cfg.title}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {openCount} open · {totalCount} total · max {cfg.max_tickets}/user
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {(() => {
                                const filtered = tickets.filter(t => {
                                    if (ticketFilter === "open") return !t.closed_at;
                                    if (ticketFilter === "closed") return !!t.closed_at;
                                    return true;
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                                            <Ticket size={48} className="mx-auto text-white/20 mb-4" />
                                            <h3 className="text-lg font-bold mb-2">
                                                {ticketFilter === "all" ? "No Tickets Yet" : `No ${ticketFilter} tickets`}
                                            </h3>
                                            <p className="text-gray-500 text-sm">
                                                {ticketFilter === "all"
                                                    ? "Tickets created via the bot will appear here."
                                                    : `There are no ${ticketFilter} tickets at the moment.`}
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid gap-3">
                                        {filtered.map((t, index) => {
                                            const isOpen = !t.closed_at;
                                            return (
                                                <div
                                                    key={t.id}
                                                    className={`bg-white/5 border rounded-xl p-5 transition-all group ${isOpen
                                                        ? "border-green-500/20 hover:border-green-500/40"
                                                        : "border-white/10 hover:border-white/20 opacity-70"
                                                        }`}
                                                    style={{ animationDelay: `${index * 40}ms` }}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                                <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                                                                    Ticket #{t.id}
                                                                </h3>
                                                                {isOpen ? (
                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 shrink-0">
                                                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                                                        Open
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 shrink-0">
                                                                        <Lock size={10} />
                                                                        Closed
                                                                    </span>
                                                                )}
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                                    {t.panel_title}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Users size={14} className="text-primary/60" />
                                                                    Opener: {t.opener_id}
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock size={14} className="text-primary/60" />
                                                                    {new Date(t.opened_at).toLocaleString()}
                                                                </span>
                                                                {t.reason && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <MessageSquare size={14} className="text-primary/60" />
                                                                        {t.reason}
                                                                    </span>
                                                                )}
                                                                {t.closed_at && (
                                                                    <span className="flex items-center gap-1.5 text-red-400/70">
                                                                        <Lock size={14} />
                                                                        Closed: {new Date(t.closed_at).toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 flex gap-2">
                                                            {isOpen ? (
                                                                <button
                                                                    onClick={async () => {
                                                                        setClosingTicketId(t.id);
                                                                        try {
                                                                            const res = await fetch(`/api/servers/${guildId}/tickets`, {
                                                                                method: "PATCH",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                body: JSON.stringify({
                                                                                    ticketId: t.id,
                                                                                    action: "close",
                                                                                    userId: user?.user_metadata?.provider_id,
                                                                                }),
                                                                            });
                                                                            if (res.ok) {
                                                                                const data = await res.json();
                                                                                setTickets(prev => prev.map(tk => tk.id === t.id ? { ...tk, ...data.ticket, panel_title: tk.panel_title } : tk));
                                                                                showToast("success", `Ticket #${t.id} closed.`);
                                                                            } else {
                                                                                showToast("error", "Failed to close ticket.");
                                                                            }
                                                                        } catch {
                                                                            showToast("error", "Network error.");
                                                                        }
                                                                        setClosingTicketId(null);
                                                                    }}
                                                                    disabled={closingTicketId === t.id}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 font-medium rounded-lg text-sm transition-all"
                                                                >
                                                                    {closingTicketId === t.id ? (
                                                                        <Loader2 size={14} className="animate-spin" />
                                                                    ) : (
                                                                        <Lock size={14} />
                                                                    )}
                                                                    Close
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={async () => {
                                                                        setClosingTicketId(t.id);
                                                                        try {
                                                                            const res = await fetch(`/api/servers/${guildId}/tickets`, {
                                                                                method: "PATCH",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                body: JSON.stringify({
                                                                                    ticketId: t.id,
                                                                                    action: "reopen",
                                                                                    userId: user?.user_metadata?.provider_id,
                                                                                }),
                                                                            });
                                                                            if (res.ok) {
                                                                                const data = await res.json();
                                                                                setTickets(prev => prev.map(tk => tk.id === t.id ? { ...tk, ...data.ticket, panel_title: tk.panel_title } : tk));
                                                                                showToast("success", `Ticket #${t.id} reopened.`);
                                                                            } else {
                                                                                showToast("error", "Failed to reopen ticket.");
                                                                            }
                                                                        } catch {
                                                                            showToast("error", "Network error.");
                                                                        }
                                                                        setClosingTicketId(null);
                                                                    }}
                                                                    disabled={closingTicketId === t.id}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-primary hover:text-black font-medium rounded-lg text-sm transition-all"
                                                                >
                                                                    {closingTicketId === t.id ? (
                                                                        <Loader2 size={14} className="animate-spin" />
                                                                    ) : (
                                                                        <Unlock size={14} />
                                                                    )}
                                                                    Reopen
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </>
                    )}

                    {activeTab === "premium" && (
                        <div className="space-y-8">
                            {/* User Status Card */}
                            <div className="bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/20 rounded-2xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex-1 text-center md:text-left">
                                        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                                            {userPremium?.is_premium ? (
                                                <>
                                                    <Sparkles className="text-blue-500 fill-blue-500 animate-pulse" size={32} />
                                                    My Premium Status: Active
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="text-gray-600" size={32} />
                                                    My Premium Status: Free
                                                </>
                                            )}
                                        </h2>
                                        <p className="text-gray-400">
                                            {userPremium?.is_premium
                                                ? "You have a personal premium subscription."
                                                : "Support the bot to get a profile badge and more."}
                                        </p>

                                        {userPremium?.is_premium && userPremium.premium_expire_time && (
                                            <div className="mt-4 flex flex-wrap gap-4 text-sm justify-center md:justify-start">
                                                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500">
                                                    Expires: {new Date(userPremium.premium_expire_time).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!userPremium?.is_premium && (
                                        <a
                                            href="https://discord.gg/ZT4KXFK3RD"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all transform hover:scale-105"
                                        >
                                            Get User Premium
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Server Status Card */}
                            <div className="bg-gradient-to-br from-yellow-900/20 to-black border border-yellow-500/20 rounded-2xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-32 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex-1 text-center md:text-left">
                                        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                                            {guildPremium?.is_premium ? (
                                                <>
                                                    <Crown className="text-yellow-500 fill-yellow-500 animate-pulse" size={32} />
                                                    Premium Active
                                                </>
                                            ) : (
                                                <>
                                                    <Crown className="text-gray-600" size={32} />
                                                    Free Plan
                                                </>
                                            )}
                                        </h2>
                                        <p className="text-gray-400">
                                            {guildPremium?.is_premium
                                                ? "Your server has access to all premium features."
                                                : "Upgrade to unlock unlimited scrims, tournaments, and more."}
                                        </p>

                                        {guildPremium?.is_premium && guildPremium.premium_end_time && (
                                            <div className="mt-4 flex flex-wrap gap-4 text-sm justify-center md:justify-start">
                                                <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500">
                                                    Expires: {new Date(guildPremium.premium_end_time).toLocaleDateString()}
                                                </div>
                                                {guildPremium.made_premium_by && (
                                                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-400">
                                                        Upgraded by: <span className="text-white font-mono">{guildPremium.made_premium_by}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {!guildPremium?.is_premium && (
                                        <a
                                            href="https://discord.gg/ZT4KXFK3RD"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all transform hover:scale-105"
                                        >
                                            Get Premium Now
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Plans Grid */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Star className="text-yellow-500" size={24} />
                                    Available Plans
                                </h3>

                                {plans.length === 0 ? (
                                    <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-gray-400">No plans available at the moment.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {plans.map((plan, idx) => (
                                            <div key={plan.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-yellow-500/50 transition-all group flex flex-col relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="relative z-10 flex-1">
                                                    <h4 className="text-lg font-bold text-white mb-2">{plan.name}</h4>
                                                    <div className="text-2xl font-bold text-yellow-500 mb-4">
                                                        ₹{plan.price}
                                                        <span className="text-sm text-gray-500 font-normal ml-1">/ {plan.description.includes('7d') ? 'week' : 'month'}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-400 mb-6 border-t border-white/10 pt-4">
                                                        {plan.description}
                                                    </p>
                                                </div>

                                                <a
                                                    href="https://discord.gg/ZT4KXFK3RD"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="relative z-10 w-full block text-center py-2.5 rounded-lg font-bold transition-all bg-white/10 hover:bg-yellow-500 hover:text-black text-white"
                                                >
                                                    Select Plan
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals for Tournament/Scrim creation (Same as before) */}
            {/* ... (Create Tournament Modal) ... */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                    <div className="bg-[#0a0a0a] border border-primary/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-primary/10 animate-in fade-in zoom-in duration-200">
                        {/* ... same modal content ... */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Trophy className="text-primary" size={22} />
                                Create Tournament
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tournament Name *</label>
                                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. BGMI Solo Tournament" maxLength={30} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary/60" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Registration Channel *</label>
                                <select value={formRegChannel} onChange={(e) => setFormRegChannel(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white">
                                    <option value="" className="bg-black">Select a channel...</option>
                                    {channels.map((c) => (<option key={c.id} value={c.id} className="bg-black">#{c.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Channel *</label>
                                <select value={formConfirmChannel} onChange={(e) => setFormConfirmChannel(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white">
                                    <option value="" className="bg-black">Select a channel...</option>
                                    {channels.map((c) => (<option key={c.id} value={c.id} className="bg-black">#{c.name}</option>))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Total Slots *</label><input type="number" value={formSlots} onChange={(e) => setFormSlots(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white" /></div>
                                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Required Mentions</label><input type="number" value={formMentions} onChange={(e) => setFormMentions(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white" /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Ping Role</label><select value={formPingRole} onChange={(e) => setFormPingRole(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white"><option value="" className="bg-black">None</option>{roles.map((r) => (<option key={r.id} value={r.id} className="bg-black">@{r.name}</option>))}</select></div>
                            <button onClick={handleCreateTournament} disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/80 disabled:bg-primary/40 text-black font-bold rounded-lg">{creating ? <Loader2 size={18} className="animate-spin" /> : "Create Tournament"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Scrim Modal */}
            {showScrimForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                    <div className="bg-[#0a0a0a] border border-primary/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-primary/10 animate-in fade-in zoom-in duration-200">
                        {/* ... same modal content ... */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Swords className="text-primary" size={22} />
                                Create Scrim
                            </h2>
                            <button
                                onClick={() => setShowScrimForm(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Scrim Name *</label><input type="text" value={scrimName} onChange={(e) => setScrimName(e.target.value)} placeholder="e.g. Daily Scrims" className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white" /></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Reg. Channel *</label>
                                <select value={scrimRegChannel} onChange={(e) => setScrimRegChannel(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white">
                                    <option value="" className="bg-black">Select a channel...</option>
                                    {channels.map((c) => (<option key={c.id} value={c.id} className="bg-black">#{c.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Slotlist Channel *</label>
                                <select value={scrimSlotChannel} onChange={(e) => setScrimSlotChannel(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white">
                                    <option value="" className="bg-black">Select a channel...</option>
                                    {channels.map((c) => (<option key={c.id} value={c.id} className="bg-black">#{c.name}</option>))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Total Slots *</label><input type="number" value={scrimSlots} onChange={(e) => setScrimSlots(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white" /></div>
                                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Required Mentions</label><input type="number" value={scrimMentions} onChange={(e) => setScrimMentions(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Open Time (IST)*</label><input type="time" value={scrimTime} onChange={(e) => setScrimTime(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white [color-scheme:dark]" /></div>
                                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Ping Role</label><select value={scrimPingRole} onChange={(e) => setScrimPingRole(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white"><option value="" className="bg-black">None</option>{roles.map((r) => (<option key={r.id} value={r.id} className="bg-black">@{r.name}</option>))}</select></div>
                            </div>
                            <button onClick={handleCreateScrim} disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/80 disabled:bg-primary/40 text-black font-bold rounded-lg">{creating ? <Loader2 size={18} className="animate-spin" /> : "Create Scrim"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
