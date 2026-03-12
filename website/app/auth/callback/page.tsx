"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AuthCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        let isMounted = true;

        const handleCallback = async () => {
            // Re-route directly to the new Next.js auth callback backend if there's a code
            const searchParams = new URLSearchParams(window.location.search);
            const code = searchParams.get('code');

            if (code) {
                // If by some chance they hit this old frontend callback route with a code,
                // redirect them to the correct backend route.
                router.replace(`/api/auth/callback?code=${code}`);
                return;
            }

            // Otherwise, just check if they are logged in.
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated) {
                        if (isMounted) {
                            setStatus("success");
                            setTimeout(() => {
                                if (isMounted) router.replace("/servers");
                            }, 500);
                        }
                    } else {
                        throw new Error("Not authenticated");
                    }
                } else {
                    throw new Error("Failed to fetch session");
                }
            } catch (err) {
                if (isMounted) {
                    setErrorMsg("Authentication failed. Please try again.");
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
