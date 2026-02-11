import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Users, Shield, Crown } from "lucide-react";

export const revalidate = 60;

export default async function TournamentTeamsPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    // Fetch tournament details
    const { data: tourney } = await supabase
        .from("tm.tourney")
        .select("*")
        .eq("id", id)
        .single();

    // Fetch registered teams using the join table
    // The relationship is: tourney -> tm.tourney_tm.register -> tm.register (Slot)
    const { data: teamData, error: teamError } = await supabase
        .from('tm.tourney_tm.register')
        .select(`
            tmslot_id,
            "tm.register" (*)
        `)
        .eq('"tm.tourney_id"', id);

    if (teamError) {
        console.error("Error fetching teams:", teamError);
    }

    // Extract the slots (teams) from the join data
    const teams = teamData?.map((item: any) => item['tm.register']) || [];

    return (
        <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8 bg-black">
            <div className="max-w-5xl mx-auto">
                <Link href="/tournaments" className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    BACK TO TOURNAMENTS
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
                        REGISTERED TEAMS
                    </h1>
                    <div className="flex items-center gap-4 text-xl text-cyan-400 font-mono">
                        <span>{tourney?.name || `Tournament #${id}`}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                        <span className="text-gray-400">{teams.length} Teams</span>
                    </div>
                </div>

                {teams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team: any) => (
                            <div key={team.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-colors group">
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-2xl font-bold text-gray-500 opacity-20">#{team.num}</span>
                                    {team.confirm_jump_url && (
                                        <div className="p-1.5 rounded-full bg-green-500/10 text-green-400" title="Confirmed">
                                            <Shield size={14} />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors truncate" title={team.team_name}>
                                    {team.team_name}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                    <Crown size={14} className="text-yellow-500" />
                                    <span className="font-mono text-xs">ID: {team.leader_id}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Users size={14} className="text-cyan-500" />
                                    <span>{team.members?.length || 0} Members</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
                        <div className="bg-cyan-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users size={40} className="text-cyan-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Teams Registered Yet</h3>
                        <p className="text-gray-400 max-w-md mx-auto">
                            Be the first to register your team for this tournament!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
