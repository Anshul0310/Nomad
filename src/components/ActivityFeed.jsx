import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSimulatedActivity } from "@/hooks/useSimulatedData"
import { Coins, Brain, Server, AlertCircle, ChevronDown } from "lucide-react"

const typeConfig = {
  earn: { icon: Coins, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "EARN" },
  spend: { icon: Coins, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "SPEND" },
  decision: { icon: Brain, color: "text-[#7c3aed]", bg: "bg-[#7c3aed]/10", border: "border-[#7c3aed]/20", label: "AI" },
  system: { icon: Server, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", label: "SYS" },
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
}

export function ActivityFeed() {
  const activities = useSimulatedActivity()
  const [expanded, setExpanded] = React.useState(false)
  const displayedActivities = expanded ? activities : activities.slice(0, 8)

  return (
    <section id="activity" className="relative py-24 bg-[#020204] overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/30" />
            <span className="text-xs font-mono text-cyan-500/60 uppercase tracking-widest">Live Feed</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30" />
          </div>
          <h2 className="text-4xl md:text-5xl font-outfit font-bold text-white text-center">
            Agent <span className="text-gradient">Activity</span>
          </h2>
          <p className="text-center text-white/40 mt-3 font-inter">
            Watch the Nomad AI think, earn, and operate in real-time.
          </p>
        </motion.div>

        {/* Activity feed */}
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-2xl overflow-hidden border border-white/10">
            {/* Terminal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-white/30 font-mono">agent-activity.log</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs text-emerald-400/60 font-mono">LIVE</span>
              </div>
            </div>

            {/* Activity list */}
            <div className="p-1 max-h-[520px] overflow-y-auto custom-scrollbar">
              <AnimatePresence initial={false}>
                {displayedActivities.map((activity) => {
                  const config = typeConfig[activity.type]
                  const Icon = config.icon
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-lg ${config.bg} border ${config.border} shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-mono font-bold ${config.color} uppercase tracking-wider`}>
                              {config.label}
                            </span>
                            <span className="text-[10px] text-white/20 font-mono">
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-white/70 font-inter leading-relaxed">
                            {activity.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Show more */}
            {activities.length > 8 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-5 py-3 border-t border-white/5 text-xs text-white/30 hover:text-white/60 font-mono flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                {expanded ? "Show less" : `Show ${activities.length - 8} more entries`}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
