"use client";

import { supabase } from "@/lib/supabase";
import { User, LogIn, LogOut, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";

export default function ProfilePage() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setLoading(false);
        };

        getUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: `${window.location.origin}/profile`, // Redirect back to profile page
            },
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen py-32 px-4 flex items-center justify-center bg-black">
                <Loader2 size={40} className="text-cyan-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-32 px-4 flex items-center justify-center bg-black relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-md w-full bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,255,255,0.1)]">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-cyan-500/10 mb-6 border border-cyan-500/20 overflow-hidden">
                        <User size={48} className="text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {user ? "Signed In" : "Welcome Back"}
                    </h1>
                    <p className="text-gray-400">
                        {user ? "You are currently logged in." : "Connect your Discord account to manage your profile"}
                    </p>
                </div>

                {user ? (
                    <div className="space-y-4">
                        <button
                            onClick={handleLogout}
                            className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold rounded-xl transition-all flex items-center justify-center gap-3"
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={handleLogin}
                            className="w-full py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-[#5865F2]/30 group"
                        >
                            <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                            <span>Login with Discord</span>
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-8">
                            By logging in, you agree to our Terms of Service & Privacy Policy.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
