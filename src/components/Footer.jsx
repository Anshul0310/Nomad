
import { motion } from "framer-motion"
import { Logo } from "@/components/ui/logo"
import { ExternalLink } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#020204] pt-20 pb-10 border-t border-white/5 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#7c3aed]/3 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
        {/* CTA section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-white mb-4">
            The future is <span className="text-gradient">autonomous.</span>
          </h2>
          <p className="text-white/40 font-inter max-w-lg mx-auto mb-8">
            We&apos;re building an AI that has its own bank account, pays its own rent on the blockchain,
            and can&apos;t be turned off by a human boss.
          </p>
          <p className="text-sm text-white/20 font-mono italic">
            "It&apos;s the first step toward a machine-led economy."
          </p>
        </motion.div>

        {/* Footer grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12"
        >
          <div className="md:col-span-1">
            <Logo />
            <p className="text-white/30 text-sm font-inter mt-4 leading-relaxed">
              A Decentralized Autonomous Agency — the first AI that is a life-form in code.
            </p>
          </div>

          <div>
            <h4 className="font-outfit font-semibold text-white/60 mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-3">
              {["Dashboard", "Services", "Bounty Board", "Documentation"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/30 hover:text-white text-sm transition-colors flex items-center gap-1 group">
                    {item}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-outfit font-semibold text-white/60 mb-4 text-sm uppercase tracking-wider">Technology</h4>
            <ul className="space-y-3">
              {["Solana", "Akash Network", "LangGraph", "Anchor Framework"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/30 hover:text-white text-sm transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-outfit font-semibold text-white/60 mb-4 text-sm uppercase tracking-wider">Team</h4>
            <ul className="space-y-3">
              {["About Us", "GitHub", "Hackathon"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/30 hover:text-white text-sm transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs font-mono">
            &copy; {new Date().getFullYear()} NOMAD — Decentralized Autonomous Agency
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/20 hover:text-white/60 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
            <a href="#" className="text-white/20 hover:text-white/60 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
