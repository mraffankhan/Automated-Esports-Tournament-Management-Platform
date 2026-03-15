"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, LogIn, Loader2 } from "lucide-react";
import { User } from "@/lib/session";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handleAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated && data.user) {
                        setUser(data.user);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Failed to fetch user session", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        handleAuth();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to logout", error);
        }
    };

    const handleLogin = () => {
        window.location.href = '/api/auth/discord';
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`fixed top-4 left-0 right-0 mx-auto w-[95%] max-w-7xl z-50 transition-all duration-300 rounded-2xl ${scrolled ? "bg-black/60 backdrop-blur-xl border border-primary/20 shadow-[0_4px_30px_rgb(0,0,0,0.5)] py-2" : "bg-transparent py-4 border border-transparent"
                    }`}
            >
                <div className="flex items-center justify-between px-6 h-14">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-black tracking-tight text-white hover:text-glow transition-all flex items-center gap-2">
                            <img src="/R_logo.png" alt="Logo" className="w-9 h-9 rounded-lg object-cover" />
                            ARGON
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <NavLink href="/#features">Features</NavLink>
                        <NavLink href="/servers">Dashboard</NavLink>
                        <NavLink href="/#community">Community</NavLink>
                        <NavLink href="/commands">Docs</NavLink>
                        {user && ["1449081308616720628"].includes(user?.id) && (
                            <NavLink href="/admin/db">Database</NavLink>
                        )}
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        {loading ? (
                            <div className="h-10 w-10 flex items-center justify-center">
                                <Loader2 size={20} className="text-primary animate-spin" />
                            </div>
                        ) : user ? (
                            <Link
                                href="/servers"
                                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group backdrop-blur-sm"
                            >
                                <div className="w-7 h-7 rounded-full overflow-hidden">
                                    <img
                                        src={user.avatar || "/default-avatar.png"}
                                        alt="User"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate max-w-[100px]">
                                    {user.global_name?.split(' ')[0] || user.username}
                                </span>
                            </Link>
                        ) : (
                            <>
                                <button
                                    onClick={handleLogin}
                                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                >
                                    Login
                                </button>
                                <Link
                                    href="/get"
                                    className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105"
                                >
                                    Add to Discord
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsOpen(true)}
                            type="button"
                            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </motion.nav>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl md:hidden"
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex justify-end p-6">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-full text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex flex-col items-center justify-center flex-grow space-y-8 p-6">
                                <MobileNavLink href="/" onClick={() => setIsOpen(false)}>Home</MobileNavLink>
                                <MobileNavLink href="/#features" onClick={() => setIsOpen(false)}>Features</MobileNavLink>
                                <MobileNavLink href="/servers" onClick={() => setIsOpen(false)}>Dashboard</MobileNavLink>
                                <MobileNavLink href="/commands" onClick={() => setIsOpen(false)}>Docs</MobileNavLink>
                                <MobileNavLink href="/get" onClick={() => setIsOpen(false)}>Support</MobileNavLink>

                                {user ? (
                                    <div className="flex flex-col items-center gap-4 mt-8 w-full pb-8 border-b border-white/10">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border border-white/20">
                                            <img
                                                src={user.avatar || "/default-avatar.png"}
                                                alt="User"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className="text-xl font-bold text-white">
                                            {user.global_name || user.username}
                                        </span>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full py-3 mt-4 rounded-xl bg-red-500/10 text-red-400 font-medium border border-red-500/20"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full flex gap-4 mt-8 pt-8 border-t border-white/10">
                                        <button
                                            onClick={() => { setIsOpen(false); handleLogin(); }}
                                            className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium border border-white/10"
                                        >
                                            Login
                                        </button>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="flex-1 py-3 rounded-xl bg-white text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                        >
                                            Add Bot
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors relative group"
        >
            {children}
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        </Link>
    );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="text-2xl font-bold text-gray-400 hover:text-white transition-colors"
        >
            {children}
        </Link>
    );
}
