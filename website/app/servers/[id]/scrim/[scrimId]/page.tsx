"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Loader2, ArrowLeft, Swords,
    Users, MessageSquare, Shield, CheckCircle2, AlertCircle,
    Play, Pause, Trash2, Save, X, Hash, Clock
} from "lucide-react";

interface Scrim {
    id: string;
    name: string;
    guild_id: string;
    registration_channel_id: string;
    slotlist_channel_id: string;
    total_slots: number;
    required_mentions: number;
    open_time: string;
    opened_at: string | null;
    closed_at: string | null;
    stoggle: boolean;
    ping_role_id: string | null;
    slot_count?: number;
}

interface Slot {
    id: number;
    num: number;
    team_name: string;
    user_id: string;
    members: string[]; // array of user IDs
}

interface Channel {
    id: string;
    name: string;
}

interface Role {
    id: string;
    name: string;
}

export default function ScrimDashboardPage({ params }: { params: Promise<{ id: string; scrimId: string }> }) {
    const { id: guildId, scrimId } = use(params);
    const router = useRouter();

    const [scrim, setScrim] = useState<Scrim | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "settings" | "slots">("overview");
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Actions state
    const [toggling, setToggling] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [formName, setFormName] = useState("");
    const [formRegChannel, setFormRegChannel] = useState("");
    const [formSlotChannel, setFormSlotChannel] = useState("");
    const [formSlots, setFormSlots] = useState(20);
    const [formMentions, setFormMentions] = useState(4);
    const [formPingRole, setFormPingRole] = useState("");
    const [formOpenTime, setFormOpenTime] = useState("");

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            try {
                // Fetch Scrim, Channels, Roles
                const [scrimRes, channelsRes, rolesRes] = await Promise.all([
                    fetch(`/api/servers/${guildId}/scrims/${scrimId}`),
                    fetch(`/api/servers/${guildId}/channels`),
                    fetch(`/api/servers/${guildId}/roles`),
                ]);

                if (scrimRes.ok && isMounted) {
                    const data = await scrimRes.json();
                    setScrim(data);

                    // Init form
                    setFormName(data.name);
                    setFormRegChannel(data.registration_channel_id);
                    setFormSlotChannel(data.slotlist_channel_id);
                    setFormSlots(data.total_slots);
                    setFormMentions(data.required_mentions);
                    setFormPingRole(data.ping_role_id || "");

                    // Format time for input
                    if (data.open_time) {
                        const date = new Date(data.open_time);
                        setFormOpenTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
                    }
                } else {
                    if (isMounted) router.push(`/servers/${guildId}`);
                    return;
                }

                if (channelsRes.ok && isMounted) {
                    const data = await channelsRes.json();
                    setChannels(data.channels || []);
                }
                if (rolesRes.ok && isMounted) {
                    const data = await rolesRes.json();
                    setRoles(data.roles || []);
                }

                // Fetch slots if scrim loaded
                const slotsRes = await fetch(`/api/servers/${guildId}/scrims/${scrimId}/slots`);
                if (slotsRes.ok && isMounted) {
                    setSlots(await slotsRes.json());
                }

            } catch (error) {
                console.error("Failed to load scrim data", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [guildId, scrimId, router]);

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const handleToggle = async () => {
        if (!scrim) return;
        setToggling(true);
        try {
            const res = await fetch(`/api/servers/${guildId}/scrims/${scrimId}/toggle`, {
                method: "POST"
            });
            if (res.ok) {
                const data = await res.json();

                // Refresh scrim data to get new opened_at/closed_at
                const refreshRes = await fetch(`/api/servers/${guildId}/scrims/${scrimId}`);
                if (refreshRes.ok) {
                    const refreshedScrim = await refreshRes.json();
                    setScrim(refreshedScrim);

                    // If opened, clear slots locally as they are wiped on open
                    if (data.status === 'opened') {
                        setSlots([]);
                    }
                }
                showToast("success", `Registration ${data.status === 'opened' ? 'Started' : 'Paused'}`);
            } else {
                showToast("error", "Failed to toggle registration");
            }
        } catch (err) {
            showToast("error", "Network error");
        }
        setToggling(false);
    };

    const handleSaveSettings = async () => {
        setSaving(true);

        // Calculate new open_time ISO
        const [hours, minutes] = formOpenTime.split(':').map(Number);
        const now = new Date();
        let openTime = new Date();
        openTime.setHours(hours, minutes, 0, 0);
        if (openTime <= now) openTime.setDate(openTime.getDate() + 1);

        try {
            const res = await fetch(`/api/servers/${guildId}/scrims/${scrimId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName,
                    registration_channel_id: formRegChannel,
                    slotlist_channel_id: formSlotChannel,
                    total_slots: formSlots,
                    required_mentions: formMentions,
                    ping_role_id: formPingRole || null,
                    open_time: openTime.toISOString()
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setScrim(updated);
                showToast("success", "Settings saved successfully");
            } else {
                showToast("error", "Failed to save settings");
            }
        } catch (err) {
            showToast("error", "Network error");
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this scrim? This action cannot be undone.")) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/servers/${guildId}/scrims/${scrimId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                router.push(`/servers/${guildId}`);
            } else {
                showToast("error", "Failed to delete scrim");
                setDeleting(false);
            }
        } catch (err) {
            showToast("error", "Network error");
            setDeleting(false);
        }
    };

    const handleDeleteSlot = async (slotId: number) => {
        if (!confirm("Remove this team from the slot?")) return;
        try {
            const res = await fetch(`/api/servers/${guildId}/scrims/${scrimId}/slots`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId })
            });

            if (res.ok) {
                setSlots(prev => prev.filter(s => s.id !== slotId));
                showToast("success", "Slot removed");
                // Update slot count in scrim object
                if (scrim) setScrim({ ...scrim, slot_count: (scrim.slot_count || 1) - 1 });
            } else {
                showToast("error", "Failed to remove slot");
            }
        } catch (err) {
            showToast("error", "Network error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4 text-white">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-gray-400 text-sm animate-pulse">Loading scrim...</p>
            </div>
        );
    }

    if (!scrim) return null;

    const isOpen = scrim.opened_at && (!scrim.closed_at || scrim.closed_at < scrim.opened_at);

    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-white">
            <div className="max-w-5xl mx-auto">
                {/* Toast */}
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
                        href={`/servers/${guildId}`}
                        className="p-2 rounded-lg border border-primary/20 hover:border-primary/50 text-primary hover:bg-primary/10 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{scrim.name}</h1>
                            {isOpen ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                    Open
                                </span>
                            ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                    Closed
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5 flex gap-4">
                            <span>ID: {scrim.id}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                Opens at {new Date(scrim.open_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 mb-8 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-400 hover:text-white"
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("slots")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "slots"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-400 hover:text-white"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            Slots
                            <span className="bg-white/10 text-xs px-1.5 rounded-full">{slots.length}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "settings"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-400 hover:text-white"
                            }`}
                    >
                        Settings
                    </button>
                </div>

                {/* Content */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === "overview" && (
                        <div className="grid gap-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-2 text-gray-400">
                                        <Users size={18} />
                                        <span className="text-sm font-medium">Slots Filled</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {slots.length} <span className="text-gray-500 text-lg">/ {scrim.total_slots}</span>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        {Math.round((slots.length / scrim.total_slots) * 100)}% Capacity
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-2 text-gray-400">
                                        <MessageSquare size={18} />
                                        <span className="text-sm font-medium">Required Mentions</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {scrim.required_mentions}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Per team registration
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-2 text-gray-400">
                                        <Swords size={18} />
                                        <span className="text-sm font-medium">Scrim Type</span>
                                    </div>
                                    <div className="text-2xl font-bold capitalize">
                                        Daily Scrim
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        {scrim.stoggle ? "Auto-managed" : "Manual"}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={handleToggle}
                                        disabled={toggling}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-black transition-all ${isOpen
                                            ? "bg-red-500 hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                            : "bg-green-500 hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                            }`}
                                    >
                                        {toggling ? <Loader2 size={20} className="animate-spin" /> : isOpen ? <Pause size={20} /> : <Play size={20} />}
                                        {isOpen ? "Pause Registration" : "Start Registration"}
                                    </button>
                                </div>
                                <p className="mt-3 text-sm text-gray-500">
                                    {isOpen
                                        ? "Registration is currently open. New teams can join."
                                        : "Registration is closed. Using this button will clear all slots and open registration."}
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === "slots" && (
                        <div className="grid gap-4">
                            {slots.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                                    <Users size={32} className="mx-auto text-gray-600 mb-3" />
                                    <p className="text-gray-400">No teams registered yet.</p>
                                </div>
                            ) : (
                                slots.map((slot) => (
                                    <div key={slot.id} className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                                {slot.num}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{slot.team_name}</div>
                                                <div className="text-xs text-gray-500">User ID: {slot.user_id}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSlot(slot.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            title="Remove Team"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="space-y-6 max-w-2xl">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Scrim Name</label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white focus:border-primary transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Total Slots</label>
                                        <input
                                            type="number"
                                            value={formSlots}
                                            onChange={(e) => setFormSlots(parseInt(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Mentions</label>
                                        <input
                                            type="number"
                                            value={formMentions}
                                            onChange={(e) => setFormMentions(parseInt(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Reg. Channel</label>
                                        <select
                                            value={formRegChannel}
                                            onChange={(e) => setFormRegChannel(e.target.value)}
                                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:border-primary transition-colors appearance-none"
                                        >
                                            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Slotlist Channel</label>
                                        <select
                                            value={formSlotChannel}
                                            onChange={(e) => setFormSlotChannel(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white focus:border-primary transition-colors appearance-none"
                                        >
                                            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Open Time</label>
                                        <input
                                            type="time"
                                            value={formOpenTime}
                                            onChange={(e) => setFormOpenTime(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white focus:border-primary transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Ping Role</label>
                                        <select
                                            value={formPingRole}
                                            onChange={(e) => setFormPingRole(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white focus:border-primary transition-colors appearance-none"
                                        >
                                            <option value="">None</option>
                                            {roles.map(r => <option key={r.id} value={r.id}>@{r.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10 flex justify-end">
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/80 transition-colors"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                                <h3 className="text-red-400 font-bold mb-2">Danger Zone</h3>
                                <p className="text-gray-400 text-sm mb-4">Deleting this scrim will remove all slots and configuration. This action cannot be undone.</p>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                >
                                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    Delete Scrim
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
