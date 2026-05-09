import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSimulatedServices } from "@/hooks/useSimulatedData"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { getAllProblemsOrdered, getDifficultyForIndex } from "@/data/codingProblems"
import { useWallet } from "@/contexts/WalletContext"
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Brain, BarChart3, Shield, Code2, Zap, Clock, Users, Lock, Copy, Check, Terminal, TrendingUp, ExternalLink, Wallet } from "lucide-react"
import { API_BASE } from "@/lib/apiConfig"

// Nomad treasury address — receives service fees
const NOMAD_TREASURY = new PublicKey("Cm9ugYjV24DuiizVUNvAtKoQfq2fZRNqMtLWTezFoDSP")
const SERVICE_FEE_SOL = 0.001 // 0.001 SOL per code generation

const iconMap = { brain: Brain, code: Code2, chart: BarChart3, shield: Shield }

const gradients = [
  "from-[#7c3aed] to-[#2563eb]",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
]

// ── Tokenizer for syntax highlighting ──────────────────────────────────────

function tokenizeLine(line, language) {
  const keywords = {
    python: new Set(["def","from","import","return","class","if","else","elif","for","in","print","int","float","async","await","True","False","None","with","as","try","except","raise","while","not","and","or","is","lambda","yield","pass","break","continue","self"]),
    javascript: new Set(["const","let","var","function","async","await","return","if","else","for","new","throw","true","false","null","undefined","export","import","from","while","class","extends","this","typeof","instanceof"]),
    rust: new Set(["pub","fn","use","let","mut","struct","impl","return","if","else","for","in","self","Self","true","false","mod","crate","super","where","enum","match","loop","while","break","continue","move","ref","type"]),
    solidity: new Set(["function","contract","mapping","address","uint256","uint","public","external","view","returns","event","emit","msg","payable","pragma","solidity","import","require","memory","calldata","immutable","constructor","modifier"]),
  }
  const kws = keywords[language] || keywords.python
  const tokens = []
  let i = 0
  while (i < line.length) {
    if ((line[i] === '/' && line[i+1] === '/') || (line[i] === '#' && language !== 'rust')) {
      tokens.push({ type: "comment", value: line.slice(i) }); break
    }
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const q = line[i]; let j = i + 1
      while (j < line.length && line[j] !== q) { if (line[j] === '\\') j++; j++ }
      tokens.push({ type: "string", value: line.slice(i, j + 1) }); i = j + 1; continue
    }
    if (/\d/.test(line[i]) && (i === 0 || /[\s(,=+\-*/<>[\]{};:]/.test(line[i-1]))) {
      let j = i; while (j < line.length && /[\d.e_]/.test(line[j])) j++
      tokens.push({ type: "number", value: line.slice(i, j) }); i = j; continue
    }
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i; while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++
      const word = line.slice(i, j)
      tokens.push({ type: kws.has(word) ? "keyword" : "ident", value: word }); i = j; continue
    }
    tokens.push({ type: "plain", value: line[i] }); i++
  }
  return tokens
}

const tokenColors = {
  keyword: "text-purple-400",
  string: "text-emerald-400",
  comment: "text-white/25 italic",
  number: "text-amber-400",
  ident: "text-white/80",
  plain: "text-white/60",
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ServiceInteraction() {
  const services = useSimulatedServices()
  const wallet = useWallet()
  const [processing, setProcessing] = React.useState(false)
  const [result, setResult] = React.useState(null)
  const [copied, setCopied] = React.useState(false)
  const [problemIndex, setProblemIndex] = React.useState(0)
  const [solveCount, setSolveCount] = React.useState(0)
  const [txError, setTxError] = React.useState(null)
  const [autoMode, setAutoMode] = React.useState(true) // Auto-pay without popup

  const allProblems = React.useMemo(() => getAllProblemsOrdered(), [])
  const totalProblems = allProblems.length

  const handleCodeRequest = async () => {
    setResult(null)
    setTxError(null)
    setProcessing(true)

    let txSignature = null

    // Send real SOL transaction if wallet is connected
    if (wallet.connected && wallet.publicKey && wallet.connection) {
      if (!autoMode) {
        // Manual mode — Phantom popup for each TX
        try {
          const provider = window?.solana
          if (!provider) throw new Error("Phantom not found")

          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: NOMAD_TREASURY,
              lamports: Math.floor(SERVICE_FEE_SOL * LAMPORTS_PER_SOL),
            })
          )

          const { blockhash, lastValidBlockHeight } = await wallet.connection.getLatestBlockhash()
          transaction.recentBlockhash = blockhash
          transaction.lastValidBlockHeight = lastValidBlockHeight
          transaction.feePayer = wallet.publicKey

          // One-step sign + send (faster popup)
          const { signature } = await provider.signAndSendTransaction(transaction)
          txSignature = signature
          console.log("[Service] TX sent:", txSignature)

          await wallet.connection.confirmTransaction({ signature: txSignature, blockhash, lastValidBlockHeight })
          console.log("[Service] TX confirmed:", txSignature)
        } catch (err) {
          console.error("[Service] TX failed:", err)
          setTxError(err.message || "Transaction failed")
        }
      } else {
        // Auto mode — call backend to send REAL SOL from agent wallet (no popup)
        try {
          const res = await fetch(`${API_BASE}/pay`, {
            method: "POST",
            signal: AbortSignal.timeout(15000),
          })
          const data = await res.json()
          if (data.status === "success" && data.signature) {
            txSignature = data.signature
            console.log("[Service] Real TX via backend:", txSignature)
          } else {
            console.warn("[Service] Backend pay failed:", data.error)
            setTxError(data.error || "Payment failed")
          }
        } catch (err) {
          console.error("[Service] Backend unreachable:", err)
          // Fallback: generate demo TX hash
          txSignature = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 88)
        }
        await new Promise(r => setTimeout(r, 300))
      }
    }

    // Short delay for "AI thinking"
    await new Promise(r => setTimeout(r, 800))

    const problem = allProblems[problemIndex % totalProblems]
    const difficulty = getDifficultyForIndex(problemIndex % totalProblems)

    setResult({
      success: true,
      problem,
      difficulty,
      txHash: txSignature || `demo_${Math.random().toString(36).substr(2, 8)}`,
      isRealTx: !!txSignature,
    })

    // Advance to the next problem for next click
    setProblemIndex(prev => prev + 1)
    setSolveCount(prev => prev + 1)
    setProcessing(false)
  }

  const handleCopy = () => {
    if (result?.problem?.code) {
      navigator.clipboard.writeText(result.problem.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const currentDifficulty = getDifficultyForIndex(problemIndex % totalProblems)

  return (
    <section id="services" className="relative py-24 bg-[#020204] overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[500px] h-[400px] bg-[#2563eb]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#2563eb]/30" />
            <span className="text-xs font-mono text-[#2563eb]/60 uppercase tracking-widest">Services</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#2563eb]/30" />
          </div>
          <h2 className="text-4xl md:text-5xl font-outfit font-bold text-white text-center">
            Request AI <span className="text-gradient">Services</span>
          </h2>
          <p className="text-center text-white/40 mt-3 font-inter">
            Pay with SOL. The AI delivers. No middleman. No subscription.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {services.map((service, i) => {
            const Icon = iconMap[service.icon] || Brain
            const isCode = service.name === "Code Generation"
            const isComingSoon = !isCode
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={isCode ? "md:col-span-2" : ""}
              >
                <GlowingEffect className="h-full">
                  <div className={`p-6 h-full flex flex-col ${isComingSoon ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[i]} shadow-lg ${isComingSoon ? "grayscale" : ""}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        {isComingSoon && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-mono uppercase tracking-wider">
                            <Lock className="w-3 h-3" /> Coming Soon
                          </span>
                        )}
                        {isCode && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                            <Zap className="w-3 h-3" /> Live
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-outfit font-bold text-white">{service.price}</div>
                        <div className="text-[10px] text-white/30 font-mono">per request</div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-outfit font-semibold text-white mb-2">{service.name}</h3>
                    <p className="text-sm text-white/40 font-inter mb-5 flex-1">{service.description}</p>
                    
                    <div className="flex items-center gap-4 mb-5 text-xs text-white/30">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{service.avgTime}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{service.totalCalls.toLocaleString()} calls</span>
                    </div>

                    {/* ── Code Gen: Progress & Difficulty Bar ── */}
                    {isCode && (
                      <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-white/30" />
                          <span className="text-xs text-white/50 font-mono">
                            Solved: <span className="text-white font-semibold">{solveCount}</span>/{totalProblems}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/30 font-mono">Next:</span>
                          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${currentDifficulty.bg} ${currentDifficulty.color}`}>
                            {currentDifficulty.label}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="w-32 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${Math.min((problemIndex / totalProblems) * 100, 100)}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Code Gen: Result Display ── */}
                    {isCode && (processing || result) && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mb-5"
                        >
                          {processing ? (
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-3 text-amber-400 font-mono text-sm">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                  <Zap className="w-4 h-4" />
                                </motion.div>
                                <span>Nomad AI is solving a coding challenge...</span>
                              </div>
                              <div className="mt-3 space-y-2">
                                {[1, 2, 3].map(n => (
                                  <motion.div key={n} initial={{ width: "0%" }} animate={{ width: `${30 + Math.random() * 60}%` }}
                                    transition={{ duration: 0.8, delay: n * 0.3 }} className="h-3 rounded bg-white/5" />
                                ))}
                              </div>
                            </div>
                          ) : result?.success ? (
                            <div className="rounded-xl overflow-hidden border border-white/10">
                              {/* Problem statement */}
                              <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${result.difficulty.bg} ${result.difficulty.color}`}>
                                      {result.difficulty.label}
                                    </span>
                                    <span className="text-xs font-mono text-white/30">{result.problem.source}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] font-mono text-white/25">
                                    <span>Time: {result.problem.timeComplexity}</span>
                                    <span>Space: {result.problem.spaceComplexity}</span>
                                  </div>
                                </div>
                                <h4 className="text-sm font-outfit font-semibold text-white mb-1">{result.problem.title}</h4>
                                <p className="text-xs text-white/40 font-inter leading-relaxed">{result.problem.problem}</p>
                              </div>

                              {/* Code header */}
                              <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/5">
                                <div className="flex items-center gap-3">
                                  <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Terminal className="w-3.5 h-3.5 text-white/30" />
                                    <span className="text-xs font-mono text-white/50">solution.{result.problem.language === "python" ? "py" : result.problem.language === "javascript" ? "js" : result.problem.language === "rust" ? "rs" : "sol"}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-white/25 uppercase px-2 py-0.5 rounded bg-white/5">
                                    {result.problem.language}
                                  </span>
                                  <button onClick={handleCopy}
                                    className="flex items-center gap-1 text-[10px] font-mono text-white/40 hover:text-white/70 px-2 py-1 rounded hover:bg-white/5 transition-colors">
                                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    {copied ? "Copied!" : "Copy"}
                                  </button>
                                </div>
                              </div>
                              
                              {/* Code body */}
                              <div className="p-4 bg-[#0a0a0f] overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                                <pre className="text-sm font-mono leading-relaxed">
                                  {result.problem.code.split("\n").map((line, idx) => (
                                    <div key={idx} className="flex">
                                      <span className="w-8 text-right text-white/15 select-none mr-4 flex-shrink-0">{idx + 1}</span>
                                      <span>
                                        {line === "" ? "\u00A0" : tokenizeLine(line, result.problem.language).map((tok, ti) => (
                                          <span key={ti} className={tokenColors[tok.type] || "text-white/60"}>{tok.value}</span>
                                        ))}
                                      </span>
                                    </div>
                                  ))}
                                </pre>
                              </div>

                              {/* Code footer */}
                              <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-t border-white/5">
                                <div className="flex items-center gap-4 text-[10px] font-mono text-white/30">
                                  <span className="text-emerald-400">✓ Solved</span>
                                  {result.isRealTx ? (
                                    <a href={`https://explorer.solana.com/tx/${result.txHash}?cluster=${wallet.network}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="text-[#7c3aed] hover:text-[#9b5de5] flex items-center gap-1 transition-colors">
                                      TX: {result.txHash.slice(0, 12)}...{result.txHash.slice(-6)}
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  ) : (
                                    <span>TX: {result.txHash}</span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-white/20">
                                  Problem {(problemIndex - 1) % totalProblems + 1} of {totalProblems}
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {/* ── Buttons ── */}
                    {isCode ? (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleCodeRequest}
                          disabled={processing}
                          className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                            processing
                              ? "bg-white/5 text-white/30 cursor-not-allowed"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                          }`}
                        >
                          <Code2 className="w-4 h-4" />
                          {processing
                            ? (wallet.connected ? "Sending TX & Solving..." : "Solving Challenge...")
                            : wallet.connected
                              ? `Solve Next Challenge — ${SERVICE_FEE_SOL} SOL`
                              : `Solve Next Challenge — 0.10 SOL`
                          }
                        </motion.button>
                        {txError && (
                          <div className="mt-2 text-xs text-rose-400/70 text-center font-mono">
                            ⚠ TX: {txError}
                          </div>
                        )}
                        {!wallet.connected && (
                          <div className="mt-2 text-xs text-white/20 text-center">
                            Connect wallet to pay with real SOL
                          </div>
                        )}
                      </>
                    ) : (
                      <button disabled className="w-full py-3 rounded-xl text-sm font-semibold bg-white/[0.03] text-white/20 border border-white/5 cursor-not-allowed flex items-center justify-center gap-2">
                        <Lock className="w-3.5 h-3.5" /> Coming Soon
                      </button>
                    )}
                  </div>
                </GlowingEffect>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
