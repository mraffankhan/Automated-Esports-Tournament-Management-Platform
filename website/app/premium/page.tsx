"use client";

import { Crown, Check, Star, Sparkles, Shield, Zap } from "lucide-react";
import Link from "next/link";

const plans = [
    {
        name: "Weekly Plan",
        price: "₹29",
        duration: "7 days",
        description: "Perfect for testing the waters.",
        features: ["Server Premium Status", "Unlimited Scrims", "Basic Support"],
        highlight: false,
        color: "text-white"
    },
    {
        name: "Monthly Plan",
        price: "₹79",
        duration: "1 month",
        description: "Our most popular starter plan.",
        features: ["All Weekly Features", "Priority Support", "Custom Bot Status"],
        highlight: true,
        color: "text-primary"
    },
    {
        name: "No Prefix Plan",
        price: "₹99",
        duration: "1 month",
        description: "Exclusive access to No Prefix commands.",
        features: ["No Prefix Commands", "Personal Badge", "Priority Support"],
        highlight: true,
        color: "text-purple-400",
        icon: <Zap size={24} className="text-purple-400" />
    },
    {
        name: "Quarterly Plan",
        price: "₹199",
        duration: "3 months",
        description: "Save big with a quarterly commitment.",
        features: ["All Monthly Features", "Advanced Analytics", "24/7 Support"],
        highlight: false,
        color: "text-yellow-400"
    },
    {
        name: "Half-Yearly Plan",
        price: "₹349",
        duration: "6 months",
        description: "Best value for long-term growth.",
        features: ["All Quarterly Features", "Dedicated Manager", "Early Access to Features"],
        highlight: false,
        color: "text-blue-400"
    },
    {
        name: "GodLike Plan",
        price: "₹4999",
        duration: "Lifetime",
        description: "One-time payment for eternal glory.",
        features: ["Lifetime Access", "All Future Features", "VVIP Support", "Developer Access"],
        highlight: true,
        color: "text-red-500",
        icon: <Crown size={24} className="text-red-500 fill-red-500 animate-pulse" />
    }
];

export default function PremiumPage() {
    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                        UNLEASH THE <span className="text-primary">POWER</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Upgrade your server or account to unlock premium features, unlimited limits, and exclusive tools.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative group bg-white/5 border rounded-2xl p-8 transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]
                                ${plan.highlight ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-white/10 hover:border-white/30'}
                            `}
                        >
                            {plan.highlight && (
                                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${plan.color.replace('text-', 'text-')}`} />
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className={`text-xl font-bold ${plan.color}`}>{plan.name}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{plan.duration}</p>
                                </div>
                                {plan.icon || <Star className={`${plan.color} opacity-80`} size={24} />}
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                <span className="text-gray-500 ml-2 text-sm">/ {plan.duration}</span>
                            </div>

                            <p className="text-gray-400 text-sm mb-8 min-h-[40px]">{plan.description}</p>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check size={16} className={`shrink-0 ${plan.color}`} />
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="https://discord.gg/ZT4KXFK3RD"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block w-full py-3 rounded-xl font-bold text-center transition-all
                                    ${plan.highlight
                                        ? 'bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_var(--color-primary-glow)]'
                                        : 'bg-white/10 hover:bg-white/20 text-white hover:text-primary'}
                                `}
                            >
                                Get Started
                            </a>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-8 md:p-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Need a Custom Solution?</h2>
                    <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                        Running a large organization or tournament platform? Contact us for custom enterprise plans tailored to your needs.
                    </p>
                    <a
                        href="https://discord.gg/ZT4KXFK3RD"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-all"
                    >
                        <Shield size={20} />
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}
