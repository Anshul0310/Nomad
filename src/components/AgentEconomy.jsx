import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { useWallet } from "@/contexts/WalletContext"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import {
  Brain, Cpu, Flame, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, XCircle, Clock, ArrowDownLeft, ArrowUpRight,
  Zap, Shield, Activity, CircleDollarSign, Timer, BarChart3,
  ExternalLink, Copy, Check, WalletIcon
} from "lucide-react"

// ── Real + fallback economy state ──────────────────────────────────────────

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() / 1000) - timestamp)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function useAgentEconomy() {
  const { connected, publicKey, balance, connection, network } = useWallet()
  const [transactions, setTransactions] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [totalIn, setTotalIn] = React.useState(0)
  const [totalOut, setTotalOut] = React.useState(0)
  const [txCount, setTxCount] = React.useState(0)

  // Fetch real transactions from Solana when wallet is connected
  React.useEffect(() => {
    if (!connected || !publicKey || !connection) return
    let cancelled = false

    const fetchTxs = async () => {
      setLoading(true)
      try {
        // Get recent transaction signatures
        const sigs = await connection.getSignaturesForAddress(publicKey, { limit: 15 })
        if (cancelled) return

        setTxCount(sigs.length)

        // Fetch full transaction details
        const txList = []
        let sumIn = 0, sumOut = 0
        const pubStr = publicKey.toBase58()

        for (const sigInfo of sigs.slice(0, 10)) {
          try {
            const tx = await connection.getTransaction(sigInfo.signature, {
              maxSupportedTransactionVersion: 0,
            })
            if (cancelled || !tx) continue

            const pre = tx.meta?.preBalances || []
            const post = tx.meta?.postBalances || []
            const keys = tx.transaction?.message?.staticAccountKeys
              || tx.transaction?.message?.accountKeys || []

            // Find our account index
            let idx = -1
            for (let i = 0; i < keys.length; i++) {
              if (keys[i].toBase58() === pubStr) { idx = i; break }
            }

            if (idx >= 0 && pre[idx] !== undefined && post[idx] !== undefined) {
              const diff = (post[idx] - pre[idx]) / LAMPORTS_PER_SOL
              const fee = (tx.meta?.fee || 0) / LAMPORTS_PER_SOL
              const isReceive = diff > 0

              if (isReceive) sumIn += diff
              else sumOut += Math.abs(diff)

              txList.push({
                id: sigInfo.signature.slice(0, 8),
                type: isReceive ? "earn" : "spend",
                amount: Math.abs(diff),
                fee,
                desc: isReceive
                  ? `Received SOL${diff > 1 ? " (Airdrop)" : ""}`
                  : `Sent SOL${fee > 0 ? ` (fee: ${fee.toFixed(6)})` : ""}`,
                time: sigInfo.blockTime ? timeAgo(sigInfo.blockTime) : "recent",
                sig: sigInfo.signature,
                slot: sigInfo.slot,
                err: sigInfo.err,
              })
            }
          } catch {
            // Skip failed tx parse
          }
        }

        if (!cancelled) {
          setTransactions(txList)
          setTotalIn(sumIn)
          setTotalOut(sumOut)
        }
      } catch (err) {
        console.warn("Failed to fetch transactions:", err)
      }
      setLoading(false)
    }

    fetchTxs()
    const interval = setInterval(fetchTxs, 30000) // refresh every 30s
    return () => { cancelled = true; clearInterval(interval) }
  }, [connected, publicKey, connection])

  // Build state from real data or fallback
  const realBalance = balance ?? 0
  const burnRate = 0.001 / 24 // HOURLY_COMPUTE_COST / 24
  const dailyBurn = 0.001
  const netProfit = totalIn - totalOut
  const profitMargin = totalIn > 0 ? ((totalIn - totalOut) / totalIn) * 100 : 0
  const runway = dailyBurn > 0 ? Math.floor(realBalance / dailyBurn) : 999

  // Critical state: below 3 SOL
  const SURVIVAL_THRESHOLD = 3.0
  const isCritical = connected && realBalance < SURVIVAL_THRESHOLD
  const status = !connected ? "offline" : isCritical ? "critical" : "running"

  const state = {
    status,
    currentTask: !connected ? "Wallet not connected" : isCritical ? "⚠ LOW BALANCE — Fund agent wallet" : "Monitoring wallet activity",
    cycle: txCount,
    balance: realBalance,
    burnRate,
    dailyBurn,
    dailyEarnings: totalIn > 0 ? totalIn / Math.max(1, Math.ceil(txCount / 5)) : 0,
    profitMargin: Math.max(0, Math.min(100, profitMargin)),
    runway,
    survivalThreshold: SURVIVAL_THRESHOLD,
    totalEarned: totalIn,
    totalSpent: totalOut,
    netProfit,
    totalTx: txCount,
    loading,
    connected,
    isCritical,
  }

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

// Agent wallet address (server-side wallet that receives funding)
const AGENT_WALLET = "EwdjzckAnAyoUJPwd94VMf4UfPPYPX1rrfVWPDZ3WfFx"

export function AgentEconomy() {
  const { state, transactions } = useAgentEconomy()
  const wallet = useWallet()
  const [showAllTx, setShowAllTx] = React.useState(false)
  const [copiedTx, setCopiedTx] = React.useState(null)
  const [fundAmount, setFundAmount] = React.useState("3")
  const [funding, setFunding] = React.useState(false)
  const [fundResult, setFundResult] = React.useState(null)
  const [distributing, setDistributing] = React.useState(false)
  const [distResult, setDistResult] = React.useState(null)
  
  const displayedTx = showAllTx ? transactions : transactions.slice(0, 5)
  
  // Network for explorer links — use real wallet network
  const network = wallet.network === "mainnet-beta" ? "mainnet-beta" : wallet.network || "devnet"
  const explorerUrl = (sig) => `https://explorer.solana.com/tx/${sig}?cluster=${network}`
  
  const copyTxId = (sig) => {
    navigator.clipboard.writeText(sig)
    setCopiedTx(sig)
    setTimeout(() => setCopiedTx(null), 2000)
  }

  // Fund agent wallet — send SOL from Phantom to agent's server wallet
  const handleFundAgent = async () => {
    if (!wallet.connected || !wallet.publicKey || !wallet.connection) return
    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) return

    setFunding(true)
    setFundResult(null)
    try {
      const { Transaction: SolTx, SystemProgram: SysProg, PublicKey: PK, LAMPORTS_PER_SOL: LSOL } = await import("@solana/web3.js")
      const provider = window?.solana
      if (!provider) throw new Error("Phantom not found")

      const tx = new SolTx().add(
        SysProg.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PK(AGENT_WALLET),
          lamports: Math.floor(amount * LSOL),
        })
      )
      const { blockhash, lastValidBlockHeight } = await wallet.connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.lastValidBlockHeight = lastValidBlockHeight
      tx.feePayer = wallet.publicKey

      const { signature } = await provider.signAndSendTransaction(tx)
      await wallet.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight })
      setFundResult({ success: true, sig: signature, amount })
    } catch (err) {
      setFundResult({ success: false, error: err.message })
    }
    setFunding(false)
  }

  // Distribute profits: agent wallet sends 60% to user's Phantom wallet
  const [totalDistributed, setTotalDistributed] = React.useState(0)
  const handleDistribute = async () => {
    if (!wallet.connected || !wallet.address) return
    const availableProfit = state.netProfit - totalDistributed
    if (availableProfit <= 0) return

    setDistributing(true)
    setDistResult(null)
    try {
      const res = await fetch(`http://localhost:8000/api/distribute?user_wallet=${wallet.address}`, {
        method: "POST",
        signal: AbortSignal.timeout(20000),
      })
      const data = await res.json()
      if (data.status === "success" && data.signature) {
        setDistResult(data)
        setTotalDistributed(prev => prev + (data.user_share || 0))
      } else {
        // If agent wallet is empty, show helpful message
        const errorMsg = data.error || "Distribution failed"
        if (errorMsg.includes("Insufficient") || errorMsg.includes("No profit")) {
          setDistResult({ error: "Agent wallet needs SOL first! Use 'Fund Agent Wallet' below to add SOL, then distribute." })
        } else {
          setDistResult({ error: errorMsg })
        }
      }
    } catch (err) {
      setDistResult({ error: "Backend not running. Start it with: python -m agent.api" })
    }
    setDistributing(false)
  }

  const remainingShare = Math.max(0, (state.netProfit - totalDistributed) * 0.6)
  
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

        {/* Connect wallet prompt */}
        {!state.connected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#7c3aed]/10 to-[#2563eb]/10 border border-[#7c3aed]/20 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#7c3aed]/20">
                <WalletIcon className="w-5 h-5 text-[#7c3aed]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-outfit font-semibold text-white">Connect your Phantom wallet</div>
                <div className="text-xs text-white/40">See your real SOL balance, on-chain transactions, and live economy data</div>
              </div>
              <button onClick={() => wallet.connect()} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-shadow">
                Connect
              </button>
            </div>
          </motion.div>
        )}

        {/* Critical state — fund agent wallet banner */}
        {state.isCritical && wallet.connected && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <div className="p-5 rounded-xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 border-2 border-rose-500/30">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-rose-500/20 animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-outfit font-bold text-rose-400 mb-1">⚠ CRITICAL: Agent Balance Below {state.survivalThreshold} SOL</div>
                  <div className="text-sm text-white/50 mb-3">The agent needs at least <span className="text-white font-semibold">{state.survivalThreshold} SOL</span> to operate. Current balance: <span className="text-rose-400 font-semibold">{state.balance.toFixed(4)} SOL</span>. Fund the agent wallet to restore operations.</div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0.1" step="0.5" value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono focus:border-rose-400/50 focus:outline-none"
                      />
                      <span className="text-xs text-white/40">SOL</span>
                    </div>
                    <button
                      onClick={handleFundAgent}
                      disabled={funding}
                      className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                        funding ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                      }`}
                    >
                      {funding ? "Sending..." : `Fund Agent — ${fundAmount} SOL`}
                    </button>
                    {fundResult?.success && (
                      <span className="text-xs text-emerald-400">✓ Funded! TX: {fundResult.sig.slice(0,8)}...</span>
                    )}
                    {fundResult?.error && (
                      <span className="text-xs text-rose-400">✗ {fundResult.error}</span>
                    )}
                  </div>
                  <div className="mt-2 text-[10px] text-white/20 font-mono">Agent wallet: {AGENT_WALLET}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading indicator */}
        {state.loading && (
          <div className="mb-4 text-center text-xs text-white/30 font-mono animate-pulse">
            Fetching on-chain data...
          </div>
        )}

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

                  {/* Fund Agent Wallet — always visible */}
                  <div className={`p-3 rounded-lg border ${state.isCritical ? "bg-rose-500/5 border-rose-500/20" : "bg-[#7c3aed]/5 border-[#7c3aed]/15"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <WalletIcon className={`w-3.5 h-3.5 ${state.isCritical ? "text-rose-400" : "text-[#7c3aed]"}`} />
                      <span className="text-[10px] font-mono text-white/40 uppercase">Fund Agent Wallet</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="number" min="0.1" step="0.5" value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:border-[#7c3aed]/50 focus:outline-none"
                        placeholder="SOL amount"
                      />
                      <button
                        onClick={handleFundAgent}
                        disabled={funding || !wallet.connected}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                          funding || !wallet.connected
                            ? "bg-white/5 text-white/20 cursor-not-allowed"
                            : state.isCritical
                              ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                              : "bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                        }`}
                      >
                        {funding ? "Sending..." : !wallet.connected ? "Connect Wallet" : `Send ${fundAmount} SOL`}
                      </button>
                    </div>
                    {fundResult?.success && (
                      <div className="text-[10px] text-emerald-400 font-mono">✓ Sent {fundResult.amount} SOL — TX: {fundResult.sig.slice(0,12)}...</div>
                    )}
                    {fundResult?.error && (
                      <div className="text-[10px] text-rose-400 font-mono">✗ {fundResult.error}</div>
                    )}
                    <div className="text-[9px] text-white/15 font-mono mt-1 truncate">Agent: {AGENT_WALLET}</div>
                  </div>
                </div>
              </div>
            </GlowingEffect>
          </motion.div>

          {/* Profit Distribution */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.18 }} className="lg:col-span-5">
            <GlowingEffect>
              <div className="p-6">
                <h3 className="text-sm font-outfit font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Profit Distribution
                </h3>

                {/* Split bars */}
                <div className="flex items-center gap-1 h-6 rounded-lg overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center" style={{ width: "60%" }}>
                    <span className="text-[9px] font-mono font-bold text-white">60% You</span>
                  </div>
                  <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#9333ea] flex items-center justify-center" style={{ width: "25%" }}>
                    <span className="text-[9px] font-mono font-bold text-white">25% Upgrade</span>
                  </div>
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center" style={{ width: "15%" }}>
                    <span className="text-[9px] font-mono font-bold text-white">15% Services</span>
                  </div>
                </div>

                {/* Amount preview + button */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                  <div className={`p-3 rounded-lg border text-center ${remainingShare > 0 ? "bg-emerald-500/5 border-emerald-500/10" : "bg-white/[0.02] border-white/5"}`}>
                    <div className="text-[10px] text-emerald-400/60 font-mono uppercase">Your Share (60%)</div>
                    <div className={`text-lg font-mono font-bold ${remainingShare > 0 ? "text-emerald-400" : "text-white/20"}`}>{remainingShare.toFixed(4)}</div>
                    <div className="text-[9px] text-white/20">{remainingShare > 0 ? "SOL → Your wallet" : "✓ Claimed"}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#7c3aed]/5 border border-[#7c3aed]/10 text-center">
                    <div className="text-[10px] text-[#7c3aed]/60 font-mono uppercase">Self-Upgrade (25%)</div>
                    <div className="text-lg font-mono font-bold text-[#a78bfa]">{(state.netProfit * 0.25).toFixed(4)}</div>
                    <div className="text-[9px] text-white/20">SOL → Agent fund</div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
                    <div className="text-[10px] text-amber-400/60 font-mono uppercase">Services (15%)</div>
                    <div className="text-lg font-mono font-bold text-amber-400">{(state.netProfit * 0.15).toFixed(4)}</div>
                    <div className="text-[9px] text-white/20">SOL → Operations</div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={handleDistribute}
                      disabled={distributing || !wallet.connected || remainingShare <= 0}
                      className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${distributing || !wallet.connected || remainingShare <= 0 ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"}`}
                    >
                      {distributing ? "Distributing..." : !wallet.connected ? "Connect Wallet" : remainingShare <= 0 ? "✓ Already Claimed" : "Distribute Profits"}
                    </button>
                  </div>
                </div>

                {/* Result */}
                {distResult?.signature && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                    <div className="text-xs text-emerald-400 font-semibold mb-1">✓ Distributed successfully!</div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-white/40 mb-2">
                      <span>You: +{distResult.user_share?.toFixed(4)} SOL</span>
                      <span>Upgrade: +{distResult.upgrade_share?.toFixed(4)} SOL</span>
                      <span>Services: +{distResult.services_share?.toFixed(4)} SOL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/30">TX:</span>
                      <a href={explorerUrl(distResult.signature)} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-[#7c3aed] hover:text-[#9b5de5] font-mono flex items-center gap-1">
                        {distResult.signature.slice(0,20)}...{distResult.signature.slice(-8)}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button onClick={() => copyTxId(distResult.signature)} className="text-white/20 hover:text-white/50">
                        {copiedTx === distResult.signature ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
                {distResult?.error && (
                  <div className="text-xs text-rose-400 font-mono">✗ {distResult.error}</div>
                )}
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
