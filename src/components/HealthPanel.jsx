import * as React from "react"
import { motion } from "framer-motion"
import { useSimulatedWallet, useBalanceHistory } from "@/hooks/useSimulatedData"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Wallet, TrendingUp, TrendingDown, Clock, Server, ArrowUpRight, Activity } from "lucide-react"

function MiniChart({ data }) {
  if (!data || data.length < 2) return null
  
  const values = data.map(d => d.balance)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  
  const width = 280
  const height = 60
  const padding = 4
  
  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((v - min) / range) * (height - 2 * padding)
    return `${x},${y}`
  }).join(" ")
  
  const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`
  const isUp = values[values.length - 1] > values[0]
  const color = isUp ? "#10b981" : "#ef4444"
  
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="mt-3">
      <defs>
        <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#chartFill)" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AnimatedNumber({ value, decimals = 4 }) {
  const [displayed, setDisplayed] = React.useState(value)
  const ref = React.useRef(value)
  
  React.useEffect(() => {
    const start = ref.current
    const end = value
    const duration = 600
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(animate)
      else ref.current = end
    }
    
    requestAnimationFrame(animate)
  }, [value])
  
  return <span>{displayed.toFixed(decimals)}</span>
}

export function HealthPanel() {
  const { balance, totalEarned, totalSpent, runway, uptime, txCount } = useSimulatedWallet()
  const history = useBalanceHistory()

  const stats = [
    {
      label: "Treasury Balance",
      value: <><AnimatedNumber value={balance} /> SOL</>,
      subValue: `≈ $${(balance * 168.42).toFixed(2)}`,
      icon: Wallet,
      color: "from-[#7c3aed] to-[#2563eb]",
      glowColor: "rgba(124,58,237,0.3)",
      chart: true,
    },
    {
      label: "Total Earned",
      value: <><AnimatedNumber value={totalEarned} /> SOL</>,
      subValue: `+${((totalEarned / (totalEarned + totalSpent)) * 100).toFixed(1)}% net positive`,
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-400",
      glowColor: "rgba(16,185,129,0.3)",
    },
    {
      label: "Total Spent",
      value: <><AnimatedNumber value={totalSpent} /> SOL</>,
      subValue: "Compute + TX fees",
      icon: TrendingDown,
      color: "from-orange-500 to-amber-500",
      glowColor: "rgba(249,115,22,0.3)",
    },
    {
      label: "Runway",
      value: <>{runway} days</>,
      subValue: `${runway > 30 ? "Healthy" : "Warning"} — auto-sustaining`,
      icon: Clock,
      color: runway > 30 ? "from-emerald-500 to-cyan-500" : "from-red-500 to-orange-500",
      glowColor: runway > 30 ? "rgba(6,182,212,0.3)" : "rgba(239,68,68,0.3)",
    },
    {
      label: "Server Uptime",
      value: <><AnimatedNumber value={uptime} decimals={2} />%</>,
      subValue: "Akash Network — GPU Node",
      icon: Server,
      color: "from-cyan-500 to-blue-500",
      glowColor: "rgba(6,182,212,0.3)",
    },
    {
      label: "Total Transactions",
      value: <>{txCount.toLocaleString()}</>,
      subValue: "On Solana mainnet-beta",
      icon: Activity,
      color: "from-[#7c3aed] to-pink-500",
      glowColor: "rgba(124,58,237,0.3)",
    },
  ]

  return (
    <section id="dashboard" className="relative py-24 bg-[#020204] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#7c3aed]/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#7c3aed]/30" />
            <span className="text-xs font-mono text-[#7c3aed]/60 uppercase tracking-widest">System Health</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#7c3aed]/30" />
          </div>
          <h2 className="text-4xl md:text-5xl font-outfit font-bold text-white text-center">
            Autonomous <span className="text-gradient">Treasury</span>
          </h2>
          <p className="text-center text-white/40 mt-3 font-inter">
            Real-time financial health of the Nomad AI — fully self-funded, zero human intervention.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <GlowingEffect className="h-full">
                <div className="p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10`} style={{ background: `linear-gradient(135deg, ${stat.glowColor}, transparent)` }}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/20" />
                  </div>
                  <div className="text-2xl md:text-3xl font-outfit font-bold text-white mb-1 tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/40 font-inter">{stat.label}</div>
                  <div className="text-xs text-white/25 mt-1">{stat.subValue}</div>
                  {stat.chart && <MiniChart data={history} />}
                </div>
              </GlowingEffect>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
