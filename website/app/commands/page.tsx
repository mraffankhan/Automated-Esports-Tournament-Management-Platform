"use client";

import { useState } from "react";
import { Search, Terminal, Zap, Shield, Settings, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";

// Define our Categories and their corresponding UI data
const CATEGORIES = [
    { id: "all", name: "All Commands", icon: Terminal, color: "text-white" },
    { id: "esports", name: "Esports", icon: Zap, color: "text-yellow-400" },
    { id: "utility", name: "Utility", icon: Settings, color: "text-blue-400" },
    { id: "mod", name: "Moderation", icon: Shield, color: "text-red-400" },
    { id: "misc", name: "Miscellaneous", icon: ChevronRight, color: "text-green-400" }
];

// Define our bot's commands statically
const COMMANDS_DATA = [
    // Esports
    { name: "tourney", category: "esports", description: "Create and manage an automatic Esports Tournament.", usage: "/tourney <action> [options]", perms: "Manage Server" },
    { name: "register", category: "esports", description: "Register a team for a tournament.", usage: "/register <team_name> <mentions...>", perms: "None" },
    { name: "cancel", category: "esports", description: "Cancel a team's registration.", usage: "/cancel", perms: "None" },
    { name: "scrims", category: "esports", description: "Automate daily custom room scrims.", usage: "/scrims setup <channel>", perms: "Manage Server" },
    { name: "groupm", category: "esports", description: "Manage tournament group allocations.", usage: "/groupm <action>", perms: "Manage Server" },
    { name: "slotm", category: "esports", description: "Manage team slots.", usage: "/slotm <action>", perms: "Manage Server" },
    { name: "ban", category: "esports", description: "Ban a user from registering in tournaments.", usage: "/ban <user>", perms: "Manage Server" },

    // Utility
    { name: "serverinfo", category: "utility", description: "Get a detailed breakdown of the current server.", usage: "/serverinfo", perms: "None" },
    { name: "info", category: "utility", description: "Check Argon's bot statistics, RAM, and usage.", usage: "/info", perms: "None" },
    { name: "dashboard", category: "utility", description: "Get a direct link to the server's web dashboard.", usage: "/dashboard", perms: "None" },
    { name: "ping", category: "utility", description: "Check Argon's latency speed.", usage: "/ping", perms: "None" },
    { name: "autopurge", category: "utility", description: "Configure channels to be automatically cleared.", usage: "/autopurge <add/remove> <channel>", perms: "Manage Channels" },
    { name: "snipe", category: "utility", description: "Retrieve the last deleted message.", usage: "/snipe", perms: "Manage Messages" },
    { name: "tag", category: "utility", description: "Create, edit, or show custom text tags.", usage: "/tag <name>", perms: "None" },

    // Mod
    { name: "modban", category: "mod", description: "Ban a member from the server.", usage: "/modban <user> [reason]", perms: "Ban Members" },
    { name: "kick", category: "mod", description: "Kick a member from the server.", usage: "/kick <user> [reason]", perms: "Kick Members" },
    { name: "mute", category: "mod", description: "Timeout a member for a duration.", usage: "/mute <user> <duration> [reason]", perms: "Moderate Members" },
    { name: "unmute", category: "mod", description: "Remove a timeout from a member.", usage: "/unmute <user>", perms: "Moderate Members" },
    { name: "purge", category: "mod", description: "Clear multiple messages at once.", usage: "/purge <amount>", perms: "Manage Messages" },
    { name: "lockdown", category: "mod", description: "Lock down the current channel.", usage: "/lockdown", perms: "Manage Channels" },
    { name: "antinuke", category: "mod", description: "Configure the server's anti-nuke protections.", usage: "/antinuke", perms: "Administrator" },

    // Misc
    { name: "setup", category: "misc", description: "Create Argon's private administrative channel.", usage: "/setup", perms: "Manage Server" },
    { name: "invite", category: "misc", description: "Get Argon's invite link.", usage: "/invite", perms: "None" },
    { name: "credit", category: "misc", description: "View the bot's developers and origins.", usage: "/credit", perms: "None" },
    { name: "prefix", category: "misc", description: "Change the server's custom prefix.", usage: "/prefix <new_prefix>", perms: "Manage Server" },
    { name: "color", category: "misc", description: "Change the color of Argon's embeds.", usage: "/color <hex>", perms: "Manage Server (Premium)" },
    { name: "footer", category: "misc", description: "Customize the embed footer.", usage: "/footer <text>", perms: "Manage Server (Premium)" },
];

export default function CommandsPage() {
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCommands = COMMANDS_DATA.filter((cmd) => {
        const matchesCategory = activeTab === "all" || cmd.category === activeTab;
        const matchesSearch = cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 font-sans pb-20">
            <Navbar />

            {/* Header Section */}
            <div className="pt-32 pb-16 px-6 relative overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] -z-10"></div>

                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-white via-primary to-purple-500 bg-clip-text text-transparent">
                        Commands Directory
                    </h1>
                    <p className="text-gray-400 text-lg md:text-2xl max-w-3xl mx-auto font-light">
                        Explore the powerful arsenal of Argon's capabilities. <br className="hidden md:block" />
                        Everything you need to automate your Esports server.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-12 max-w-2xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-primary/70 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search for a command or feature..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-6 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] focus:shadow-[0_0_30px_var(--color-primary-glow)] backdrop-blur-md"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6">

                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeTab === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${isActive
                                        ? "bg-primary text-black shadow-[0_0_20px_var(--color-primary-glow)] scale-105"
                                        : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <Icon size={18} className={isActive ? "text-black" : cat.color} />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                {/* Commands Grid */}
                {filteredCommands.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCommands.map((cmd) => (
                            <div
                                key={cmd.name}
                                className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.15)] hover:-translate-y-1 overflow-hidden"
                            >
                                {/* Glow behind card */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                                <div className="relative z-10 flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-md font-mono text-xl font-bold tracking-tight border border-primary/20">
                                            /{cmd.name}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 uppercase tracking-wider">
                                        {cmd.category}
                                    </span>
                                </div>

                                <p className="text-gray-300 mb-6 text-sm leading-relaxed relative z-10 min-h-[40px]">
                                    {cmd.description}
                                </p>

                                <div className="space-y-3 relative z-10 border-t border-white/5 pt-4">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">Usage</span>
                                        <code className="text-xs text-gray-300 font-mono bg-black px-2 py-1 rounded border border-white/5 block w-max">
                                            {cmd.usage}
                                        </code>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">Requires</span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Shield size={12} className="text-primary/70" />
                                            {cmd.perms}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6">
                            <Search className="h-10 w-10 text-gray-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No commands found</h3>
                        <p className="text-gray-400">We couldn't find anything matching "{searchQuery}"</p>
                        <button
                            onClick={() => { setSearchQuery(""); setActiveTab("all"); }}
                            className="mt-6 text-primary hover:text-white transition-colors border-b border-primary/30 hover:border-white pb-1"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
