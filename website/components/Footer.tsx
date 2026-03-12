import Link from "next/link";
import { Github, Twitter, MessageSquare } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black/80 backdrop-blur-md border-t border-white/10 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
                    <div className="col-span-2">
                        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-white mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <span className="text-white text-lg leading-none">A</span>
                            </div>
                            ARGON
                        </Link>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
                            The ultimate next-generation Discord bot for moderation, community management, and absolute automation.
                        </p>
                        <div className="flex space-x-4">
                            <Link href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                                <Twitter size={18} />
                            </Link>
                            <Link href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                                <Github size={18} />
                            </Link>
                            <Link href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                                <MessageSquare size={18} />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Product</h3>
                        <ul className="space-y-3">
                            <li><Link href="/#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="/servers" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                            <li><Link href="/premium" className="text-sm text-gray-400 hover:text-white transition-colors">Premium</Link></li>
                            <li><Link href="/tournaments" className="text-sm text-gray-400 hover:text-white transition-colors">Tournaments</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Resources</h3>
                        <ul className="space-y-3">
                            <li><Link href="/commands" className="text-sm text-gray-400 hover:text-white transition-colors">Commands</Link></li>
                            <li><Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                            <li><Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <li><Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/refunds" className="text-sm text-gray-400 hover:text-white transition-colors">Refund Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-xs shadow-inner">
                        © {new Date().getFullYear()} Argon Bot. Built by RAVONIXX. All rights reserved. Not affiliated with Discord.
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-gray-400 font-medium">All systems operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
