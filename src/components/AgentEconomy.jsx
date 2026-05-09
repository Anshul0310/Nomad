import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import {
  Brain, Cpu, Flame, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, XCircle, Clock, ArrowDownLeft, ArrowUpRight,
  Zap, Shield, Activity, CircleDollarSign, Timer, BarChart3,
  ExternalLink, Copy, Check
} from "lucide-react"

// ── Simulated economy state ────────────────────────────────────────────────

function useAgentEconomy() {
  const [state, setState] = React.useState({
    status: "running",        // running | idle | critical | offline
    currentTask: "Code Generation — solving challenge #3",
    cycle: 4291,
    // Economy
    balance: 14.7832,
    burnRate: 0.0047,         // SOL per hour
    dailyBurn: 0.1128,
    dailyEarnings: 0.3200,
    profitMargin: 64.8,       // percent
    runway: 131,              // days
    survivalThreshold: 2.0,   // SOL minimum
    // Cumulative
    totalEarned: 8.4210,
    totalSpent: 3.1578,
    netProfit: 5.2632,
    totalTx: 4291,
  })

  const [transactions, setTransactions] = React.useState([
    { id: "tx1", type: "earn", amount: 0.10, desc: "Code Generation — REST API Health Check", time: "2m ago", sig: "5xKpR9mNzQv7bW3cYd8fGhJkLpTrVs2nMqXw4eAzBu6tCyDi1jF8oU5sHa" },
    { id: "tx2", type: "spend", amount: 0.0012, desc: "Solana TX fee — service delivery", time: "2m ago", sig: "3bRq7wLpNk2sVfXm5tG9hYcE4dJrKuAz8pQiW6oBn1jMaC3eFlTxRy0vHg" },
    { id: "tx3", type: "earn", amount: 0.05, desc: "Sentiment Analysis — BTC market report", time: "8m ago", sig: "9vMn2kDsHf4pBwLr7tXjQcG1eAzYi5oNmK8sCu3bRxWa6dJgVh0lTqFyEp" },
    { id: "tx4", type: "spend", amount: 0.0034, desc: "Compute cost — GPU inference (Akash)", time: "8m ago", sig: "1pLx4jHrWn8cFv2mBqKs5tDg7eAzYiNk3oRuXa6bCw9dGhJlTfMySv0QEp" },
    { id: "tx5", type: "earn", amount: 0.10, desc: "Code Generation — JWT Auth Middleware", time: "15m ago", sig: "7nBw6tQzRk3cFv9mGhJsLp1eAzYiDx4oKuXa8bMw2dNaCyWl5jHrTfSqEp" },
    { id: "tx6", type: "spend", amount: 0.0008, desc: "Solana TX fee — token transfer", time: "22m ago", sig: "4dCv8mYsHn1pBwLr6tXjQcG3eAzFiKk5oRuNa9bMx2wDgJhTl7sCfVyEqW" },
    { id: "tx7", type: "earn", amount: 0.08, desc: "Data Analysis — portfolio report", time: "31m ago", sig: "2fGh5pWxNk7cBvLr4tXjQs9eAzYiDm1oRuKa3bMw8dCgJhTl6sCnFyEqRp" },
    { id: "tx8", type: "spend", amount: 0.0021, desc: "Compute cost — model inference", time: "35m ago", sig: "8kTr1nJmWf3cBv6pGhLs4eAzYiDx9oKuXa5bMw2dNaCyRl7jHqTfSgEpQw" },
  ])

  // Simulate live updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        cycle: prev.cycle + 1,
        balance: prev.balance + (Math.random() * 0.002 - 0.0005),
        totalTx: prev.totalTx + 1,
        burnRate: 0.0047 + (Math.random() * 0.001 - 0.0005),
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return { state, transactions }
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = {
    running:  { label: "Agent Running",  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", pulse: true },
    idle:     { label: "Agent Idle",     color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   dot: "bg-amber-400",   pulse: false },
    critical: { label: "CRITICAL",       color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20",     dot: "bg-rose-400",     pulse: true },
    offline:  { label: "Offline",        color: "text-white/30",    bg: "bg-white/5 border-white/10",            dot: "bg-white/30",     pulse: false },
  }
  const c = config[status] || config.offline
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold ${c.bg} ${c.color}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} ${c.pulse ? "animate-pulse" : ""}`} />
      {c.label}
    </span>
  )
}

// ── Gauge Ring ─────────────────────────────────────────────────────────────

function GaugeRing({ value, max, label, color, icon: Icon, critical }) {
  const pct = Math.min((value / max) * 100, 100)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const isCrit = critical && pct < 15

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="6" />
          <motion.circle
            cx="40" cy="40" r={radius} fill="none"
            stroke={isCrit ? "#ef4444" : color}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`w-5 h-5 ${isCrit ? "text-rose-400" : "text-white/60"}`} />
        </div>
      </div>
      <div className="text-center">
        <div className={`text-sm font-outfit font-bold ${isCrit ? "text-rose-400" : "text-white"}`}>
          {typeof value === "number" ? value.toFixed(value < 1 ? 4 : 1) : value}
        </div>
        <div className="text-[10px] text-white/30 font-mono uppercase">{label}</div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AgentEconomy() {
  const { state, transactions } = useAgentEconomy()
  const [showAllTx, setShowAllTx] = React.useState(false)
  const [copiedTx, setCopiedTx] = React.useState(null)
  const [expandedTx, setExpandedTx] = React.useState(null)
  
  const displayedTx = showAllTx ? transactions : transactions.slice(0, 5)
  
  // Network for explorer links (devnet default)
  const network = "devnet"
  const explorerUrl = (sig) => `https://explorer.solana.com/tx/${sig}?cluster=${network}`
  const truncateSig = (sig) => `${sig.slice(0, 8)}...${sig.slice(-6)}`
  
  const copyTxId = (sig) => {
    navigator.clipboard.writeText(sig)
    setCopiedTx(sig)
    setTimeout(() => setCopiedTx(null), 2000)
  }
  
  // Determine health status
  const healthScore = Math.min(100, Math.max(0,
    (state.profitMargin > 0 ? 30 : 0) +
    (state.runway > 30 ? 30 : state.runway > 7 ? 15 : 0) +
    (state.balance > state.survivalThreshold ? 25 : state.balance > 1 ? 10 : 0) +
    (state.status === "running" ? 15 : 0)
  ))
  
  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 50 ? "Healthy" : healthScore >= 25 ? "Warning" : "Critical"
  const healthColor = healthScore >= 80 ? "text-emerald-400" : healthScore >= 50 ? "text-amber-400" : "text-rose-400"

  return (
    <section className="relative py-24 bg-[#020204] overflow-hidden">
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#7c3aed]/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/30" />
            <span className="text-xs font-mono text-emerald-500/60 uppercase tracking-widest">Economy Node</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-500/30" />
          </div>
          <h2 className="text-4xl md:text-5xl font-outfit font-bold text-white text-center">
            Agent <span className="text-gradient">Economy</span>
          </h2>
          <p className="text-center text-white/40 mt-3 font-inter max-w-xl mx-auto">
            Financial self-awareness — the AI tracks its burn rate, profitability, and survival time in real-time.
          </p>
        </motion.div>

        {/* Top row: Status + Gauges */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          
          {/* Agent Status Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <GlowingEffect className="h-full">
              <div className="p-6 h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                      <Brain className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-outfit font-semibold text-white">Agent Core</div>
                      <div className="text-[10px] text-white/30 font-mono">Cycle #{state.cycle.toLocaleString()}</div>
                    </div>
                  </div>
                  <StatusBadge status={state.status} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02]">
                    <span className="text-xs text-white/40 flex items-center gap-1.5"><Cpu className="w-3 h-3" /> Current Task</span>
                    <span className="text-xs text-white/70 font-mono truncate max-w-[200px]">{state.currentTask}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02]">
                    <span className="text-xs text-white/40 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Transactions</span>
                    <span className="text-xs text-white font-mono font-semibold">{state.totalTx.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02]">
                    <span className="text-xs text-white/40 flex items-center gap-1.5"><Shield className="w-3 h-3" /> Health Score</span>
                    <span className={`text-xs font-mono font-semibold ${healthColor}`}>{healthScore}/100 — {healthLabel}</span>
                  </div>
                </div>
              </div>
            </GlowingEffect>
          </motion.div>

          {/* Economy Gauges */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <GlowingEffect className="h-full">
              <div className="p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-outfit font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-white/40" /> Financial Vitals
                  </h3>
                  <span className="text-[10px] font-mono text-white/25">Auto-updating every 5s</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <GaugeRing value={state.balance} max={20} label="Treasury (SOL)" color="#7c3aed" icon={CircleDollarSign} critical />
                  <GaugeRing value={state.burnRate} max={0.01} label="Burn Rate/hr" color="#f59e0b" icon={Flame} />
                  <GaugeRing value={state.profitMargin} max={100} label="Profit Margin %" color="#10b981" icon={TrendingUp} />
                  <GaugeRing value={state.runway} max={365} label="Runway (days)" color="#06b6d4" icon={Timer} critical />
                </div>
              </div>
            </GlowingEffect>
          </motion.div>
        </div>

        {/* Bottom row: P&L Summary + Transaction Log */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          
          {/* P&L Summary */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="lg:col-span-2">
            <GlowingEffect className="h-full">
              <div className="p-6 h-full">
                <h3 className="text-sm font-outfit font-semibold text-white mb-5 flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-white/40" /> Profit & Loss
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-white/50"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total Earned</div>
                    <span className="text-sm font-mono font-bold text-emerald-400">+{state.totalEarned.toFixed(4)} SOL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-white/50"><TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Total Spent</div>
                    <span className="text-sm font-mono font-bold text-rose-400">-{state.totalSpent.toFixed(4)} SOL</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-white/50"><Zap className="w-3.5 h-3.5 text-amber-400" /> Net Profit</div>
                    <span className="text-lg font-mono font-bold text-white">+{state.netProfit.toFixed(4)} SOL</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  
                  {/* Daily breakdown */}
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-white/30 font-mono uppercase mb-2">Daily Breakdown</div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/40">Revenue</span>
                      <span className="text-xs font-mono text-emerald-400">+{state.dailyEarnings.toFixed(4)} SOL</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/40">Burn</span>
                      <span className="text-xs font-mono text-rose-400">-{state.dailyBurn.toFixed(4)} SOL</span>
                    </div>
                    {/* Profit bar */}
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${state.profitMargin}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-white/20">0%</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{state.profitMargin.toFixed(1)}% margin</span>
                    </div>
                  </div>

                  {/* Survival threshold */}
                  <div className={`p-3 rounded-lg border ${state.balance > state.survivalThreshold * 3 ? "bg-emerald-500/5 border-emerald-500/10" : state.balance > state.survivalThreshold ? "bg-amber-500/5 border-amber-500/10" : "bg-rose-500/5 border-rose-500/10"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {state.balance > state.survivalThreshold * 3 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : state.balance > state.survivalThreshold ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span className="text-[10px] font-mono text-white/40 uppercase">Survival Check</span>
                    </div>
                    <div className="text-xs text-white/60">
                      {state.balance > state.survivalThreshold * 3
                        ? `Treasury is ${(state.balance / state.survivalThreshold).toFixed(0)}x above survival threshold. Agent is self-sustaining.`
                        : state.balance > state.survivalThreshold
                        ? `Warning: Approaching survival threshold of ${state.survivalThreshold} SOL.`
                        : `CRITICAL: Below survival threshold! Agent may need to reduce operations.`
                      }
                    </div>
                  </div>
                </div>
              </div>
            </GlowingEffect>
          </motion.div>

          {/* Transaction Log */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="lg:col-span-3">
            <GlowingEffect className="h-full">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-outfit font-semibold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-white/40" /> SOL Transaction Log
                  </h3>
                  <span className="text-[10px] font-mono text-white/25">
                    {transactions.length} recent
                  </span>
                </div>
                
                <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                  <AnimatePresence>
                    {displayedTx.map((tx, i) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                      >
                        {/* Row 1: Description + Amount */}
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${tx.type === "earn" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                            {tx.type === "earn" 
                              ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                              : <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white/70 truncate">{tx.desc}</div>
                          </div>
                          <div className={`text-sm font-mono font-semibold whitespace-nowrap ${tx.type === "earn" ? "text-emerald-400" : "text-rose-400"}`}>
                            {tx.type === "earn" ? "+" : "-"}{tx.amount.toFixed(4)} SOL
                          </div>
                        </div>
                        {/* Row 2: TX ID + Actions — always visible */}
                        <div className="flex items-center gap-2 mt-2 ml-10">
                          <span className="text-[10px] text-white/20 font-mono">TX:</span>
                          <span className="text-[10px] text-white/35 font-mono truncate flex-1">{tx.sig}</span>
                          <span className="text-[10px] text-white/20">{tx.time}</span>
                          <button onClick={() => copyTxId(tx.sig)}
                            className="text-[10px] text-white/25 hover:text-white/60 transition-colors flex items-center gap-0.5 ml-1">
                            {copiedTx === tx.sig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a href={explorerUrl(tx.sig)} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-[#7c3aed] hover:text-[#9b5de5] transition-colors flex items-center gap-0.5">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {transactions.length > 5 && (
                  <button
                    onClick={() => setShowAllTx(!showAllTx)}
                    className="mt-3 w-full py-2 rounded-lg bg-white/[0.03] text-xs text-white/40 hover:text-white/60 font-mono transition-colors"
                  >
                    {showAllTx ? "Show less" : `View all ${transactions.length} transactions`}
                  </button>
                )}
              </div>
            </GlowingEffect>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
