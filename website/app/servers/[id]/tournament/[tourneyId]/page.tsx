"use client";

import { useEffect, useState, use } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Loader2, ArrowLeft, Trophy, Users, MessageSquare, Hash, Settings,
    Play, Pause, Trash2, Download, X, CheckCircle2, AlertCircle,
    Shield, ToggleLeft, ToggleRight, Save, ChevronDown, Eye
} from "lucide-react";

type Tab = "overview" | "settings" | "slots";

interface Tournament {
    id: number;
    guild_id: string;
    name: string;
    registration_channel_id: string;
    confirm_channel_id: string;
    role_id: string;
    ping_role_id: string | null;
    required_mentions: number;
    total_slots: number;
    host_id: string;
    multiregister: boolean;
    teamname_compulsion: boolean;
    no_duplicate_name: boolean;
    autodelete_rejected: boolean;
    success_message: string | null;
    group_size: number | null;
    required_lines: number;
    allow_duplicate_tags: boolean;
    started_at: string | null;
    closed_at: string | null;
    slot_count: number;
}

interface Role {
    id: string;
    name: string;
    color: number;
}

interface Slot {
    id: number;
    num: number;
    team_name: string;
    leader_id: string;
    members: string[];
    jump_url: string | null;
}

interface Channel {
    id: string;
    name: string;
}

export default function TourneyDashboard({
    params,
}: {
    params: Promise<{ id: string; tourneyId: string }>;
}) {
    const { id: guildId, tourneyId } = use(params);
    const [tourney, setTourney] = useState<Tournament | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("overview");
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Edit form state
    const [editName, setEditName] = useState("");
    const [editSlots, setEditSlots] = useState(0);
    const [editMentions, setEditMentions] = useState(0);
    const [editMultireg, setEditMultireg] = useState(false);
    const [editTeamCompulsion, setEditTeamCompulsion] = useState(false);
    const [editNoDupName, setEditNoDupName] = useState(true);
    const [editAutodeleteRejected, setEditAutodeleteRejected] = useState(false);
    const [editSuccessMessage, setEditSuccessMessage] = useState("");
    const [editGroupSize, setEditGroupSize] = useState<number | null>(null);
    const [editRequiredLines, setEditRequiredLines] = useState(0);
    const [editAllowDupTags, setEditAllowDupTags] = useState(true);
    const [editRegChannel, setEditRegChannel] = useState("");
    const [editConfirmChannel, setEditConfirmChannel] = useState("");
    const [editPingRole, setEditPingRole] = useState("");

    const router = useRouter();

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    useEffect(() => {
        const loadData = async (session: any) => {
            const [tourneyRes, channelsRes, rolesRes] = await Promise.all([
                fetch(`/api/servers/${guildId}/tournaments/${tourneyId}`),
                fetch(`/api/servers/${guildId}/channels`),
                fetch(`/api/servers/${guildId}/roles`),
            ]);

            if (tourneyRes.ok) {
                const t = await tourneyRes.json();
                setTourney(t);
                // Populate edit form
                setEditName(t.name);
                setEditSlots(t.total_slots);
                setEditMentions(t.required_mentions);
                setEditMultireg(t.multiregister);
                setEditTeamCompulsion(t.teamname_compulsion);
                setEditNoDupName(t.no_duplicate_name);
                setEditAutodeleteRejected(t.autodelete_rejected);
                setEditSuccessMessage(t.success_message || "");
                setEditGroupSize(t.group_size);
                setEditRequiredLines(t.required_lines);
                setEditAllowDupTags(t.allow_duplicate_tags);
                setEditRegChannel(t.registration_channel_id);
                setEditConfirmChannel(t.confirm_channel_id);
                setEditPingRole(t.ping_role_id || "");
            }

            if (channelsRes.ok) {
                const data = await channelsRes.json();
                setChannels(data.channels || []);
            }

            if (rolesRes.ok) {
                const data = await rolesRes.json();
                setRoles(data.roles || []);
            }

            setLoading(false);
        };

        // Check initial session
        const fetchSession = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated && data.user) {
                        // Pass user or session data if loadData expects it
                        loadData(data.user);
                        return;
                    }
                }
                router.push("/");
            } catch (err) {
                router.push("/");
            }
        };

        fetchSession();
    }, [guildId, tourneyId, router]);

    const loadSlots = async () => {
        const res = await fetch(`/api/servers/${guildId}/tournaments/${tourneyId}/slots`);
        if (res.ok) setSlots(await res.json());
    };

    useEffect(() => {
        if (tab === "slots") loadSlots();
    }, [tab]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/servers/${guildId}/tournaments/${tourneyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    total_slots: editSlots,
                    required_mentions: editMentions,
                    multiregister: editMultireg,
                    teamname_compulsion: editTeamCompulsion,
                    no_duplicate_name: editNoDupName,
                    autodelete_rejected: editAutodeleteRejected,
                    success_message: editSuccessMessage || null,
                    group_size: editGroupSize,
                    required_lines: editRequiredLines,
                    allow_duplicate_tags: editAllowDupTags,
                    registration_channel_id: editRegChannel,
                    confirm_channel_id: editConfirmChannel,
                    ping_role_id: editPingRole || null,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setTourney((prev) => prev ? { ...prev, ...data.tournament } : prev);
                showToast("success", "Settings saved!");
            } else {
                showToast("error", "Failed to save settings.");
            }
        } catch { showToast("error", "Network error."); }
        setSaving(false);
    };

    const handleToggle = async () => {
        setToggling(true);
        try {
            const res = await fetch(`/api/servers/${guildId}/tournaments/${tourneyId}/toggle`, {
                method: "POST",
            });
            if (res.ok) {
                const data = await res.json();
                const now = new Date().toISOString();
                setTourney((prev) => {
                    if (!prev) return prev;
                    return data.status === "started"
                        ? { ...prev, started_at: now, closed_at: null }
                        : { ...prev, started_at: null, closed_at: now };
                });
                showToast("success", data.status === "started" ? "Registration started!" : "Registration paused!");
            } else {
                const err = await res.json().catch(() => ({}));
                showToast("error", err.error || "Failed to toggle registration.");
            }
        } catch { showToast("error", "Network error."); }
        setToggling(false);
    };

    const handleDeleteSlot = async (slotId: number) => {
        try {
            const res = await fetch(`/api/servers/${guildId}/tournaments/${tourneyId}/slots`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId }),
            });
            if (res.ok) {
                setSlots((prev) => prev.filter((s) => s.id !== slotId));
                setTourney((prev) => prev ? { ...prev, slot_count: prev.slot_count - 1 } : prev);
                showToast("success", "Slot cancelled.");
            } else {
                showToast("error", "Failed to cancel slot.");
            }
        } catch { showToast("error", "Network error."); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/servers/${guildId}/tournaments/${tourneyId}`, { method: "DELETE" });
            if (res.ok) {
                router.push(`/servers/${guildId}`);
            } else {
                showToast("error", "Failed to delete tournament.");
            }
        } catch { showToast("error", "Network error."); }
        setDeleting(false);
    };

    const handleExportCSV = () => {
        if (!slots.length) { showToast("error", "No slots to export. Go to Slots tab first."); return; }
        const header = "Slot #,Team Name,Leader ID,Members,Jump URL\n";
        const rows = slots.map((s) =>
            `${s.num},"${s.team_name}",${s.leader_id},"${(s.members || []).join(" | ")}",${s.jump_url || ""}`
        ).join("\n");
        const blob = new Blob([header + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tournament_${tourneyId}_slots.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("success", "CSV downloaded!");
    };

    if (loading || !tourney) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-gray-400 text-sm animate-pulse">Loading tournament...</p>
            </div>
        );
    }

    const isOpen = tourney.started_at && !tourney.closed_at;
    const statusLabel = isOpen ? "Open" : tourney.closed_at ? "Closed" : "Not Started";
    const statusColor = isOpen ? "green" : tourney.closed_at ? "red" : "yellow";

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "overview", label: "Overview", icon: <Eye size={16} /> },
        { id: "settings", label: "Settings", icon: <Settings size={16} /> },
        { id: "slots", label: "Slots", icon: <Users size={16} /> },
    ];

    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Toast */}
                {toast && (
                    <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl animate-in ${toast.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                        }`}>
                        {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href={`/servers/${guildId}`} className="p-2 rounded-lg border border-primary/20 hover:border-primary/50 text-primary hover:bg-primary/10 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <Trophy className="text-primary shrink-0" size={22} />
                            <h1 className="text-2xl font-bold text-white truncate">{tourney.name}</h1>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border shrink-0 bg-${statusColor}-500/10 text-${statusColor}-400 border-${statusColor}-500/20 flex items-center gap-1`}>
                                {isOpen && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                                {statusLabel}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm">ID: {tourney.id} · {tourney.slot_count}/{tourney.total_slots} slots filled</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button onClick={handleToggle} disabled={toggling}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${isOpen
                            ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                            : "bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"
                            } disabled:opacity-50`}>
                        {toggling ? <Loader2 size={16} className="animate-spin" /> : isOpen ? <Pause size={16} /> : <Play size={16} />}
                        {isOpen ? "Pause Registration" : "Start Registration"}
                    </button>
                    <button onClick={() => { if (tab !== "slots") setTab("slots"); handleExportCSV(); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all">
                        <Download size={16} /> Export CSV
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
                        <Trash2 size={16} /> Delete
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-primary/10 mb-6 overflow-x-auto no-scrollbar">
                    {tabs.map((t) => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-300"
                                }`}>
                            {t.icon} {t.label}
                            {t.id === "slots" && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{tourney.slot_count}</span>}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {tab === "overview" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in">
                        {[
                            { label: "Tournament Name", value: tourney.name, icon: <Trophy size={16} className="text-primary" /> },
                            { label: "Total Slots", value: `${tourney.slot_count} / ${tourney.total_slots}`, icon: <Users size={16} className="text-primary" /> },
                            { label: "Required Mentions", value: String(tourney.required_mentions), icon: <MessageSquare size={16} className="text-primary" /> },
                            { label: "Status", value: statusLabel, icon: isOpen ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} className="text-gray-400" /> },
                            { label: "Multi-Register", value: tourney.multiregister ? "Allowed" : "Not Allowed", icon: <Shield size={16} className="text-primary" /> },
                            { label: "Team Name Required", value: tourney.teamname_compulsion ? "Yes" : "No", icon: <Hash size={16} className="text-primary" /> },
                            { label: "Duplicate Names", value: tourney.no_duplicate_name ? "Not Allowed" : "Allowed", icon: <Shield size={16} className="text-primary" /> },
                            { label: "Auto-delete Rejected", value: tourney.autodelete_rejected ? "Yes" : "No", icon: <Trash2 size={16} className="text-primary" /> },
                            { label: "Teams per Group", value: tourney.group_size ? String(tourney.group_size) : "Not Set", icon: <Users size={16} className="text-primary" /> },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
                                <div className="mt-0.5">{item.icon}</div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</p>
                                    <p className="text-white font-medium mt-0.5">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === "settings" && (
                    <div className="space-y-6 animate-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Tournament Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tournament Name</label>
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={30}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary/60 transition-colors" />
                            </div>
                            {/* Total Slots */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Total Slots</label>
                                <input type="number" value={editSlots} onChange={(e) => setEditSlots(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={500}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary/60 transition-colors" />
                            </div>
                            {/* Required Mentions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Required Mentions</label>
                                <input type="number" value={editMentions} onChange={(e) => setEditMentions(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))} min={0} max={10}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary/60 transition-colors" />
                            </div>
                            {/* Group Size */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Teams per Group</label>
                                <input type="number" value={editGroupSize || ""} onChange={(e) => setEditGroupSize(e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Not set" min={1}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-primary/60 transition-colors" />
                            </div>
                            {/* Required Lines */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Minimum Lines</label>
                                <input type="number" value={editRequiredLines} onChange={(e) => setEditRequiredLines(Math.max(0, parseInt(e.target.value) || 0))} min={0}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary/60 transition-colors" />
                            </div>
                            {/* Success Message */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Success Message (DM)</label>
                                <textarea value={editSuccessMessage} onChange={(e) => setEditSuccessMessage(e.target.value)} maxLength={500} rows={2}
                                    placeholder="Message sent to users on successful registration..."
                                    className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-primary/60 transition-colors resize-none" />
                            </div>
                            {/* Registration Channel */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Registration Channel</label>
                                <select value={editRegChannel} onChange={(e) => setEditRegChannel(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary/60 transition-colors appearance-none">
                                    {channels.map((c) => (<option key={c.id} value={c.id} className="bg-black">#{c.name}</option>))}
                                </select>
                            </div>
                            {/* Confirm Channel */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Channel</label>
                                <select value={editConfirmChannel} onChange={(e) => setEditConfirmChannel(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary/60 transition-colors appearance-none">
                                    {channels.map((c) => (<option key={c.id} value={c.id} className="bg-black">#{c.name}</option>))}
                                </select>
                            </div>
                            {/* Ping Role */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Ping Role</label>
                                <select value={editPingRole} onChange={(e) => setEditPingRole(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary/60 transition-colors appearance-none">
                                    <option value="" className="bg-black">None</option>
                                    {roles.map((r) => (<option key={r.id} value={r.id} className="bg-black">@{r.name}</option>))}
                                </select>
                                <p className="text-xs text-gray-600 mt-1">Role to ping when registration opens</p>
                            </div>
                        </div>

                        {/* Toggle switches */}
                        <div className="space-y-3 border-t border-primary/10 pt-5">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Toggles</h3>
                            {[
                                { label: "Allow Multi-Register", value: editMultireg, set: setEditMultireg, desc: "Allow users to register multiple times" },
                                { label: "Team Name Required", value: editTeamCompulsion, set: setEditTeamCompulsion, desc: "Require users to include team name" },
                                { label: "Block Duplicate Names", value: editNoDupName, set: setEditNoDupName, desc: "Prevent teams with same name" },
                                { label: "Auto-delete Rejected", value: editAutodeleteRejected, set: setEditAutodeleteRejected, desc: "Auto-remove rejected registrations" },
                                { label: "Allow Duplicate Tags", value: editAllowDupTags, set: setEditAllowDupTags, desc: "Allow same user to be tagged in multiple teams" },
                            ].map((toggle) => (
                                <button key={toggle.label} onClick={() => toggle.set(!toggle.value)}
                                    className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-lg border border-primary/10 transition-colors group">
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-white">{toggle.label}</p>
                                        <p className="text-xs text-gray-500">{toggle.desc}</p>
                                    </div>
                                    <div className={`w-11 h-6 rounded-full relative transition-colors ${toggle.value ? "bg-primary" : "bg-gray-700"}`}>
                                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${toggle.value ? "left-[22px]" : "left-0.5"}`} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Save */}
                        <button onClick={handleSave} disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 disabled:bg-primary/40 text-black font-bold rounded-lg transition-all hover:shadow-[0_0_15px_var(--color-primary-glow)] disabled:cursor-not-allowed">
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {saving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                )}

                {tab === "slots" && (
                    <div className="animate-in">
                        {slots.length === 0 ? (
                            <div className="text-center py-16 bg-primary/5 rounded-2xl border border-primary/20">
                                <Users size={48} className="mx-auto text-primary/30 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">No Registrations Yet</h3>
                                <p className="text-gray-500 text-sm">Slots will appear here once teams register.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-gray-400">{slots.length} registered team{slots.length !== 1 ? "s" : ""}</p>
                                    <button onClick={handleExportCSV}
                                        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
                                        <Download size={14} /> Export CSV
                                    </button>
                                </div>
                                {slots.map((slot) => (
                                    <div key={slot.id} className="flex items-center gap-4 bg-primary/5 border border-primary/15 rounded-lg p-3 hover:border-primary/30 transition-colors group">
                                        <span className="text-primary font-bold text-sm w-8 text-center shrink-0">{slot.num}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium text-sm truncate">{slot.team_name}</p>
                                            <p className="text-gray-500 text-xs">Leader: {slot.leader_id} · {(slot.members || []).length} members</p>
                                        </div>
                                        <button onClick={() => handleDeleteSlot(slot.id)}
                                            className="shrink-0 p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                        <div className="bg-[#0a0a0a] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in">
                            <Trash2 size={40} className="text-red-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white text-center mb-2">Delete Tournament?</h2>
                            <p className="text-gray-400 text-sm text-center mb-6">
                                This will permanently delete <strong className="text-white">{tourney.name}</strong>, all registered slots, and the Discord role. This cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 border border-primary/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors font-medium">
                                    Cancel
                                </button>
                                <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    {deleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
