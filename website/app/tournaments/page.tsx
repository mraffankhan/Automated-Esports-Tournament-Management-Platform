import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Trophy, Users, Calendar, ArrowRight, Shield } from "lucide-react";

export const revalidate = 60;

export default async function TournamentsPage() {
    const { data: tournaments } = await supabase
        .from("tm.tourney")
        .select(`
            *,
            registrations: "tm.tourney_tm.register" (count)
        `);

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <Navbar />

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <div className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                        TOURNAMENTS
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Compete in high-stakes tournaments and prove your dominance.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {tournaments && tournaments.length > 0 ? (
                        tournaments.map((tourney: any) => (
                            <TournamentCard key={tourney.id} tourney={tourney} />
                        ))
                    ) : (
                        <div className="col-span-1 text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                            <Trophy size={64} className="mx-auto text-gray-600 mb-6" />
                            <h3 className="text-2xl font-bold text-gray-400">No Active Tournaments</h3>
                            <p className="text-gray-500 mt-2">Check back later for upcoming events.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TournamentCard({ tourney }: { tourney: any }) {
    // Determine status color
    const isOpen = !tourney.closed_at;
    const statusColor = isOpen ? "text-green-400" : "text-red-400";
    const statusBg = isOpen ? "bg-green-400/10 border-green-400/20" : "bg-red-400/10 border-red-400/20";
    const statusText = isOpen ? "REGISTRATION OPEN" : "REGISTRATION CLOSED";

    // Get team count
    const teamCount = tourney.registrations?.[0]?.count || 0;

    return (
        <div className="group relative w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <div className="flex flex-col md:flex-row">
                {/* Left Side - Visual/Icon */}
                <div className="w-full md:w-48 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/5">
                    <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        <Trophy size={40} className="text-cyan-400" />
                    </div>
                </div>

                {/* Middle - Content */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBg} ${statusColor} tracking-wider`}>
                            {statusText}
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-mono">
                            <Shield size={12} className="text-cyan-500" />
                            ID: {tourney.guild_id}
                        </div>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2 group-hover:text-cyan-400 transition-colors">
                        {tourney.name}
                    </h3>

                    <div className="flex items-center gap-6 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-cyan-500" />
                            <span className="font-medium text-white">{teamCount}</span>
                            <span>Teams Registered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>{tourney.total_slots} Slots Total</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Actions */}
                <div className="p-6 md:p-8 flex flex-col justify-center gap-3 md:w-64 border-t md:border-t-0 md:border-l border-white/5 bg-white/[0.02]">
                    <Link
                        href={`https://discord.com/channels/${tourney.guild_id}/${tourney.registration_channel_id}`}
                        target="_blank"
                        className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-center rounded-xl transition-all hover:scale-[1.02] shadow-[0_4px_14px_0_rgba(6,182,212,0.39)]"
                    >
                        REGISTER NOW
                    </Link>
                    <Link
                        href={`/tournaments/${tourney.id}/teams`}
                        className="w-full py-3 bg-transparent border border-white/20 hover:border-cyan-500/50 text-white hover:text-cyan-400 font-bold text-center rounded-xl transition-all hover:bg-white/5 flex items-center justify-center gap-2 group/btn"
                    >
                        <span>VIEW TEAMS</span>
                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
