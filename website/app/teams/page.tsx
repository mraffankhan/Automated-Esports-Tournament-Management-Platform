import { supabase } from "@/lib/supabase";
import { Search, Users, Shield } from "lucide-react";

export const revalidate = 60;

export default async function TeamsPage() {
    const { data: teams, error } = await supabase
        .from("tm.register") // Assuming this is where teams are registered
        .select("*")
        .order("id", { ascending: false })
        .limit(50); // Pagination would be better for production

    if (error) {
        console.error("Error fetching teams:", error);
        return (
            <div className="min-h-screen py-24 px-4 text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Error Loading Teams</h1>
                <p className="text-gray-400">Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 bg-black">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black text-center mb-12 tracking-tighter">
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                        REGISTERED TEAMS
                    </span>
                </h1>

                {/* Search Bar Placeholder - Could be made functional with client component */}
                <div className="max-w-md mx-auto mb-12 relative">
                    <input
                        type="text"
                        placeholder="Search teams..."
                        className="w-full bg-black/50 border border-cyan-500/30 rounded-full py-3 px-12 text-white focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams?.map((team) => (
                        <div key={team.id} className="bg-black/40 border border-cyan-500/20 rounded-xl p-6 hover:bg-cyan-500/5 transition-all hover:border-cyan-500/50 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-cyan-500/20 p-3 rounded-full">
                                    <Shield size={24} className="text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">
                                        {team.team_name}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-mono">ID: {team.num}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span>Leader ID</span>
                                    <span className="text-gray-300 font-mono">{team.leader_id}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span>Members</span>
                                    <span className="text-gray-300">{team.members.length} Players</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {teams?.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <Users size={64} className="mx-auto mb-6 opacity-20" />
                        <p className="text-xl">No teams found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
