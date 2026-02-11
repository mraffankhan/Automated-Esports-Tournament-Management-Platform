import Link from "next/link";
import { ArrowRight, Trophy, Users, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          {/* Animated background particles can be added here */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              POTATO BOT
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            The ultimate esports management tool for your Discord server.
            Automate tournaments, manage teams, and engage your community.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/get"
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg rounded-none skew-x-[-10deg] transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2 group"
            >
              <div className="skew-x-[10deg] flex items-center gap-2">
                ADD TO DISCORD <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link
              href="/tournaments"
              className="px-8 py-4 bg-transparent border border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:text-white font-bold text-lg rounded-none skew-x-[-10deg] transition-all hover:bg-cyan-500/10"
            >
              <div className="skew-x-[10deg]">
                VIEW TOURNAMENTS
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
            WHY <span className="text-cyan-400">POTATO?</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Trophy size={48} className="text-cyan-400" />}
              title="Automated Tournaments"
              description="Create and manage brackets, schedule matches, and track results automatically."
            />
            <FeatureCard
              icon={<Users size={48} className="text-cyan-400" />}
              title="Team Management"
              description="Users can create teams, manage rosters, and register for events seamlessly."
            />
            <FeatureCard
              icon={<Shield size={48} className="text-cyan-400" />}
              title="Secure System"
              description="Built with security in mind to ensure fair play and reliable data management."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 border border-cyan-500/20 bg-black/40 backdrop-blur-sm hover:border-cyan-500/60 transition-all hover:-translate-y-2 group">
      <div className="mb-6 p-4 bg-cyan-500/10 rounded-full w-fit group-hover:bg-cyan-500/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
