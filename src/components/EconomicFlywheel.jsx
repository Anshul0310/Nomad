import * as React from "react"
import { motion } from "framer-motion"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Brain, Wallet, Server, Users, ArrowRight, RotateCcw } from "lucide-react"

const steps = [
  {
    icon: Brain,
    title: "1. Work",
    subtitle: "The Brain",
    description: "AI performs a service — generates an image, analyzes sentiment, or executes a trade.",
    color: "from-[#7c3aed] to-[#2563eb]",
    tech: "LangGraph / OpenAI",
  },
  {
    icon: Wallet,
    title: "2. Earn",
    subtitle: "The Wallet",
    description: "Customer pays SOL directly to the AI's own Solana wallet. Instant, trustless settlement.",
    color: "from-emerald-500 to-teal-500",
    tech: "Solana / Keypair",
  },
  {
    icon: Server,
    title: "3. Sustain",
    subtitle: "The Body",
    description: "Every 24h, the AI checks its runway and sends SOL to Akash Network to pay for its own compute.",
    color: "from-cyan-500 to-blue-500",
    tech: "Akash Network",
  },
  {
    icon: Users,
    title: "4. Grow",
    subtitle: "The Loop",
    description: "Once profits hit a threshold, the AI posts a bounty via smart contract — hiring humans to improve itself.",
    color: "from-amber-500 to-orange-500",
    tech: "Anchor / Solana",
  },
]

export function EconomicFlywheel() {
  return (
    <section className="relative py-24 bg-[#020204] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7c3aed]/5 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#7c3aed]/30" />
            <span className="text-xs font-mono text-[#7c3aed]/60 uppercase tracking-widest">The Loop</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#7c3aed]/30" />
          </div>
          <h2 className="text-4xl md:text-5xl font-outfit font-bold text-white text-center">
            Economic <span className="text-gradient">Flywheel</span>
          </h2>
          <p className="text-center text-white/40 mt-3 font-inter max-w-2xl mx-auto">
            A self-sustaining loop. The AI works, earns, pays its own bills, and hires humans to improve — recursively.
          </p>
        </motion.div>

        {/* Flywheel steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative"
            >
              <GlowingEffect className="h-full">
                <div className="p-6 h-full flex flex-col text-center">
                  <div className={`mx-auto p-4 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg mb-5`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-outfit font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-xs text-white/30 font-mono mb-3">{step.subtitle}</p>
                  <p className="text-sm text-white/40 font-inter flex-1">{step.description}</p>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] text-white/20 font-mono">{step.tech}</span>
                  </div>
                </div>
              </GlowingEffect>
              
              {/* Arrow between cards (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                  <ArrowRight className="w-5 h-5 text-white/10" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Recursive arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex justify-center"
        >
          <div className="flex items-center gap-3 text-white/20">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-white/10" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <RotateCcw className="w-5 h-5 text-[#7c3aed]/40" />
            </motion.div>
            <span className="text-xs font-mono text-[#7c3aed]/40">Recursive Loop</span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </motion.div>

        {/* Tech stack pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <p className="text-center text-[10px] font-mono text-white/20 uppercase tracking-widest mb-4">Powered By</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Solana", "Akash Network", "LangGraph", "OpenAI", "Anchor", "Docker", "React", "WebSockets"].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-white/30 bg-white/[0.03] border border-white/5 hover:border-[#7c3aed]/20 hover:text-white/50 transition-all duration-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
