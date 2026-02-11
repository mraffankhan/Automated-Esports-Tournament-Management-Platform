import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-cyan-500/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center bg-black">
                <div className="mb-4 md:mb-0">
                    <Link href="/" className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        POTATO
                    </Link>
                    <p className="text-gray-500 text-sm mt-1">
                        © {new Date().getFullYear()} Potato Bot. All rights reserved.
                    </p>
                </div>
                <div className="flex space-x-6">
                    <Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                        <Twitter size={20} />
                    </Link>
                    <Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                        <Github size={20} />
                    </Link>
                </div>
            </div>
        </footer>
    );
}
