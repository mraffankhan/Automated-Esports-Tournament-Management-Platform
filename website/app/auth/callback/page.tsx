"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AuthCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        let isMounted = true;

        const handleCallback = async () => {
            try {
                // Supabase auto-detects the tokens from the URL hash/query
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    if (isMounted) {
                        setErrorMsg(error.message);
                        setStatus("error");
                    }
                    return;
                }

                if (session) {
                    // Persist Discord access token
                    if (session.provider_token) {
                        localStorage.setItem('discord_access_token', session.provider_token);
                    }

                    if (isMounted) {
                        setStatus("success");
                        // Small delay so user sees the success state
                        setTimeout(() => {
                            if (isMounted) router.replace("/servers");
                        }, 500);
                    }
                } else {
                    // No session yet — wait a moment for Supabase to process the hash
                    await new Promise(r => setTimeout(r, 1500));

                    const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();

                    if (retryError || !retrySession) {
                        if (isMounted) {
                            setErrorMsg("Could not complete authentication. Please try again.");
                            setStatus("error");
                        }
                        return;
                    }

                    if (retrySession.provider_token) {
                        localStorage.setItem('discord_access_token', retrySession.provider_token);
                    }

                    if (isMounted) {
                        setStatus("success");
                        setTimeout(() => {
                            if (isMounted) router.replace("/servers");
                        }, 500);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setErrorMsg("An unexpected error occurred.");
                    setStatus("error");
                }
            }
        };

        handleCallback();
        return () => { isMounted = false; };
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-6 text-white">
            {status === "loading" && (
                <>
                    <Loader2 size={48} className="text-primary animate-spin" />
                    <p className="text-gray-400 text-sm animate-pulse">Completing login...</p>
                </>
            )}

            {status === "success" && (
                <>
                    <div className="p-4 bg-green-500/10 rounded-full border border-green-500/30">
                        <CheckCircle2 size={48} className="text-green-400" />
                    </div>
                    <p className="text-green-400 font-medium">Login successful! Redirecting...</p>
                </>
            )}

            {status === "error" && (
                <>
                    <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30">
                        <AlertCircle size={48} className="text-red-400" />
                    </div>
                    <p className="text-red-400 text-center max-w-md">{errorMsg}</p>
                    <button
                        onClick={() => router.push("/servers")}
                        className="px-6 py-2 bg-primary hover:bg-primary/80 text-black font-bold rounded-lg transition-all"
                    >
                        Try Again
                    </button>
                </>
            )}
        </div>
    );
}
