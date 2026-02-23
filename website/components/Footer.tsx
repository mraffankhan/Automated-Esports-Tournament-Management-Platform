import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-primary/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center bg-black">
                <div className="mb-4 md:mb-0">
                    <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        ARGON
                    </Link>
                    <p className="text-gray-500 text-sm mt-1">
                        © {new Date().getFullYear()} Argon Bot. All rights reserved.
                    </p>
                </div>
                <div className="flex space-x-6">
                    <Link href="#" className="text-gray-400 hover:text-primary transition-colors">
                        <Twitter size={20} />
                    </Link>
                    <Link href="#" className="text-gray-400 hover:text-primary transition-colors">
                        <Github size={20} />
                    </Link>
                </div>
            </div>
        </footer>
    );
}
