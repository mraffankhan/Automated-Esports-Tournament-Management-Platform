"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Trophy, Swords, Ticket, Database, UserPlus, Crown, Shield, Server, Box, Terminal } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [stats, setStats] = useState({
    commands: "0",
    users: "0",
    servers: "0",
    uptime: "99.9%"
  });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStats({
            commands: data.commands.toLocaleString(),
            users: data.users.toLocaleString(),
            servers: data.servers.toLocaleString(),
            uptime: data.uptime
          });
        }
      })
      .catch(err => console.error("Failed to fetch stats", err));
  }, []);

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm font-medium mb-8 backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Argon v2.0 is now live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter leading-[1.1] text-white"
          >
            The Next Generation
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent">
              Discord Bot
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Powerful esports management, complete tournament automation, and advanced ticket support for your growing community.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto"
          >
            <Link
              href="/get"
              className="px-8 py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:-translate-y-1"
            >
              Add to Discord <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/servers"
              className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
            >
              <Box size={20} /> Open Dashboard
            </Link>
          </motion.div>
        </div>

        {/* Dashboard Preview Mock */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
          className="w-full max-w-5xl mx-auto mt-20 px-6 relative z-20 hidden md:block"
        >
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="h-[400px] w-full relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center">
              {/* Abstract Representation of a Dashboard UI */}
              <div className="w-full h-full p-8 grid grid-cols-3 gap-6 opacity-60">
                <div className="col-span-1 space-y-4">
                  <div className="h-24 rounded-lg bg-white/5 border border-white/10"></div>
                  <div className="h-32 rounded-lg bg-white/5 border border-white/10"></div>
                  <div className="h-20 rounded-lg bg-white/5 border border-white/10"></div>
                </div>
                <div className="col-span-2 space-y-4">
                  <div className="h-40 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/20"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-40 rounded-lg bg-white/5 border border-white/10"></div>
                    <div className="h-40 rounded-lg bg-white/5 border border-white/10"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>



      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Everything you need.</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">A modern toolkit designed to help your community thrive effortlessly and securely.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Trophy size={28} />}
              title="Esports Tournaments"
              description="Create, manage, and automate bracket systems and full-scale tournaments securely via dashboard."
            />
            <FeatureCard
              icon={<Swords size={28} />}
              title="Scrims Organization"
              description="Host robust daily scrims with auto-slotlists, mention requirements, and role ping automations."
            />
            <FeatureCard
              icon={<Ticket size={28} />}
              title="Interactive Ticketing"
              description="Create custom support panels with interactive buttons, live transcripts, and per-user limits to handle inquiries."
            />
            <FeatureCard
              icon={<Database size={28} />}
              title="Scale & Stability"
              description="Built on top of a highly optimized persistent database ensuring extremely fast queries and no data loss."
            />
            <FeatureCard
              icon={<UserPlus size={28} />}
              title="Auto-Roles & Linking"
              description="Easily grant roles on join automatically or manage dedicated media partner integrations natively."
            />
            <FeatureCard
              icon={<Crown size={28} />}
              title="Premium Features"
              description="Advanced premium tracking, guild enhancements, and an integrated system to take tournaments to the next level."
            />
          </div>
        </div>
      </section>

      {/* Community & Stats Section */}
      <section id="community" className="py-32 bg-black/50 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Powering huge communities.</h2>
            <p className="text-gray-400 text-lg">Real-time statistics showing Argon's impact across Discord.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/5 bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
            <StatCard title="Active Servers" value={stats.servers} />
            <StatCard title="Commands Executed" value={stats.commands} />
            <StatCard title="Total Users" value={stats.users} />
            <StatCard title="Uptime" value={stats.uptime} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-r from-primary/30 to-secondary/30 blur-[100px] rounded-full mix-blend-screen"></div>
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">Add the bot to your server today.</h2>
          <p className="text-xl text-gray-400 mb-10">It only takes a couple of clicks to transform your community experience.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get"
              className="px-8 py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
            >
              Add to Discord
            </Link>
            <Link
              href="#"
              className="px-8 py-4 bg-white/5 text-white font-bold text-lg rounded-xl border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-2"
            >
              <Terminal size={20} /> Join Support Server
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="text-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 mb-2 drop-shadow-lg"
      >
        {value}
      </motion.div>
      <div className="text-sm font-medium text-gray-400 uppercase tracking-widest">{title}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden backdrop-blur-sm">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 mb-6 group-hover:text-white group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}


