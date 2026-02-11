import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";

export default function GetPage() {
    return (
        <div className="min-h-screen py-24 px-4 flex flex-col items-center justify-center bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

            <div className="relative z-10 max-w-4xl text-center">
                <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                        GET POTATO
                    </span>
                </h1>

                <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                    Add Potato Bot to your server today and start hosting tournaments like a pro.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-8 border border-cyan-500/30 bg-black/60 backdrop-blur-xl rounded-2xl hover:border-cyan-500/60 transition-all group">
                        <h2 className="text-2xl font-bold text-white mb-4">Invite Bot</h2>
                        <p className="text-gray-400 mb-8">
                            Click below to invite Potato Bot to your Discord server with full permissions.
                        </p>
                        <Link
                            href="https://discord.com/oauth2/authorize?client_id=1470031097357140063&permissions=8&integration_type=0&scope=applications.commands+bot+"
                            target="_blank"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors"
                        >
                            <span>INVITE NOW</span>
                            <ArrowRight size={20} />
                        </Link>
                    </div>

                    <div className="p-8 border border-gray-800 bg-black/60 backdrop-blur-xl rounded-2xl hover:border-gray-600 transition-all group">
                        <h2 className="text-2xl font-bold text-white mb-4">Support Server</h2>
                        <p className="text-gray-400 mb-8">
                            Need help? Join our official support server for assistance and updates.
                        </p>
                        <Link
                            href="https://discord.gg/ZT4KXFK3RD"
                            target="_blank"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] text-white font-bold rounded-xl hover:bg-[#4752C4] transition-colors"
                        >
                            <MessageCircle size={20} />
                            <span>JOIN SUPPORT</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
