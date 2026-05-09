import * as React from "react"
import { motion } from "framer-motion"
import { useBountyData } from "@/hooks/useAgentAPI"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Award, Clock, ExternalLink, Tag, User, CheckCircle2 } from "lucide-react"

const difficultyColors = {
  Easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Hard: "bg-red-500/10 text-red-400 border-red-500/20",
}

const statusConfig = {
  open: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Open" },
  claimed: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Claimed" },
  completed: { color: "text-white/40", bg: "bg-white/5", label: "Completed" },
}

function timeAgo(date) {
  if (!date) return "recently"
  try {
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return "recently"
    const diff = Date.now() - d.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return "just now"
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  } catch {
    return "recently"
  }
}

export function BountyBoard() {
  const bounties = useBountyData()

  return (
    <section id="bounties" className="relative py-24 bg-[#020204] overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30" />
            <span className="text-xs font-mono text-amber-500/60 uppercase tracking-widest">Bounties</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/30" />
          </div>
          <h2 className="text-4xl md:text-5xl font-outfit font-bold text-white text-center">
            Bounty <span className="text-gradient">Board</span>
          </h2>
          <p className="text-center text-white/40 mt-3 font-inter">
            The AI hires humans. Complete tasks, earn SOL — paid by the agent&apos;s smart contract.
          </p>
        </motion.div>

        <div className="space-y-4 max-w-4xl mx-auto">
          {bounties.map((bounty, i) => {
            const status = statusConfig[bounty.status]
            
            return (
              <motion.div
                key={bounty.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <GlowingEffect>
                  <div className={`p-6 ${bounty.status === "completed" ? "opacity-60" : ""}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Left: Icon + content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-outfit font-semibold text-white">{bounty.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${difficultyColors[bounty.difficulty]}`}>
                            {bounty.difficulty}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        
                        <p className="text-sm text-white/40 font-inter mb-3 leading-relaxed">
                          {bounty.description}
                        </p>
                        
                        <div className="flex items-center gap-3 flex-wrap">
                          {bounty.tags.map((tag) => (
                            <span key={tag} className="flex items-center gap-1 text-[10px] text-white/30 bg-white/5 px-2 py-1 rounded-md font-mono">
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                          <span className="text-[10px] text-white/20 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {timeAgo(bounty.postedAt)}
                          </span>
                          {bounty.claimedBy && (
                            <span className="text-[10px] text-amber-400/60 flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              {bounty.claimedBy}
                            </span>
                          )}
                          {bounty.completedBy && (
                            <span className="text-[10px] text-emerald-400/60 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {bounty.completedBy}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Reward + action */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-xl font-outfit font-bold text-gradient">{bounty.reward}</div>
                          <div className="text-[10px] text-white/20 font-mono">reward</div>
                        </div>
                        {bounty.status === "open" && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-shadow"
                          >
                            <Award className="w-3.5 h-3.5" />
                            Claim Bounty
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </GlowingEffect>
              </motion.div>
            )
          })}
        </div>

        {/* Smart contract notice */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-white/20 font-mono flex items-center justify-center gap-2">
            <ExternalLink className="w-3 h-3" />
            All bounties are managed by an on-chain Anchor smart contract on Solana
          </p>
        </motion.div>
      </div>
    </section>
  )
}
