import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSimulatedServices } from "@/hooks/useSimulatedData"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Brain, BarChart3, Shield, Code2, Zap, Clock, Users, Wallet, Lock, Copy, Check, Terminal } from "lucide-react"

const iconMap = {
  brain: Brain,
  code: Code2,
  chart: BarChart3,
  shield: Shield,
}

const gradients = [
  "from-[#7c3aed] to-[#2563eb]",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
]

// Demo code outputs for when backend is offline
const DEMO_CODE_OUTPUTS = [
  {
    language: "python",
    title: "Solana Token Transfer",
    code: `from solana.rpc.api import Client
from solders.keypair import Keypair
from solders.system_program import transfer, TransferParams

def send_sol(sender: Keypair, to: str, amount_sol: float):
    """Transfer SOL to another wallet."""
    client = Client("https://api.devnet.solana.com")
    lamports = int(amount_sol * 1e9)
    
    tx = transfer(TransferParams(
        from_pubkey=sender.pubkey(),
        to_pubkey=Pubkey.from_string(to),
        lamports=lamports,
    ))
    
    result = client.send_transaction(tx, sender)
    print(f"✓ Sent {amount_sol} SOL → TX: {result.value}")
    return result.value`,
    explanation: "Transfer SOL between wallets on Solana devnet using solana-py",
    complexity: "medium",
  },
  {
    language: "javascript",
    title: "Jupiter Token Price Fetcher",
    code: `async function getTokenPrice(mintAddress) {
  const url = \`https://api.jup.ag/price/v2?ids=\${mintAddress}\`;
  const res = await fetch(url);
  const data = await res.json();
  
  const token = data.data[mintAddress];
  if (!token) throw new Error("Token not found");
  
  return {
    symbol: token.mintSymbol,
    price: parseFloat(token.price),
    timestamp: new Date().toISOString(),
  };
}

// Usage
const SOL = "So11111111111111111111111111111111111111112";
getTokenPrice(SOL).then(p => 
  console.log(\`\${p.symbol}: $\${p.price}\`)
);`,
    explanation: "Fetches real-time token prices from Jupiter aggregator API",
    complexity: "simple",
  },
  {
    language: "rust",
    title: "Anchor PDA Derivation",
    code: `use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [b"treasury", authority.key().as_ref()],
        bump,
    )]
    pub treasury: Account<'info, Treasury>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Treasury {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}`,
    explanation: "Anchor smart contract PDA initialization with treasury account",
    complexity: "medium",
  },
]

// Syntax highlighting — tokenize into React elements (no dangerouslySetInnerHTML needed)
function tokenizeLine(line, language) {
  const keywords = {
    python: new Set(["def", "from", "import", "return", "class", "if", "else", "elif", "for", "in", "print", "int", "float", "async", "await", "True", "False", "None", "with", "as", "try", "except", "raise"]),
    javascript: new Set(["const", "let", "var", "function", "async", "await", "return", "if", "else", "for", "new", "throw", "true", "false", "null", "undefined", "export", "import", "from"]),
    rust: new Set(["pub", "fn", "use", "let", "mut", "struct", "impl", "return", "if", "else", "for", "in", "self", "Self", "true", "false", "mod", "crate", "super", "where"]),
    solidity: new Set(["function", "contract", "mapping", "address", "uint256", "public", "external", "view", "returns", "event", "emit", "msg", "payable", "pragma"]),
  }
  const kws = keywords[language] || keywords.python

  // Split into tokens: words, strings, numbers, punctuation
  const tokens = []
  let i = 0
  while (i < line.length) {
    // Comments
    if ((line[i] === '/' && line[i+1] === '/') || (line[i] === '#' && language === 'python')) {
      tokens.push({ type: "comment", value: line.slice(i) })
      break
    }
    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const q = line[i]
      let j = i + 1
      while (j < line.length && line[j] !== q) { if (line[j] === '\\') j++; j++ }
      tokens.push({ type: "string", value: line.slice(i, j + 1) })
      i = j + 1
      continue
    }
    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s(,=+\-*/<>[\]{};:]/.test(line[i-1]))) {
      let j = i
      while (j < line.length && /[\d.e]/.test(line[j])) j++
      tokens.push({ type: "number", value: line.slice(i, j) })
      i = j
      continue
    }
    // Words (identifiers / keywords)
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++
      const word = line.slice(i, j)
      tokens.push({ type: kws.has(word) ? "keyword" : "ident", value: word })
      i = j
      continue
    }
    // Other characters
    tokens.push({ type: "plain", value: line[i] })
    i++
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

export function ServiceInteraction() {
  const services = useSimulatedServices()
  const [selectedService, setSelectedService] = React.useState(null)
  const [processing, setProcessing] = React.useState(false)
  const [result, setResult] = React.useState(null)
  const [copied, setCopied] = React.useState(false)

  const isCodeGeneration = (name) => name === "Code Generation"

  const handleCodeRequest = async (service) => {
    setSelectedService(service)
    setResult(null)
    setProcessing(true)

    // Try the real backend first
    try {
      const res = await fetch("http://localhost:8000/api/service/code_generation", {
        method: "POST",
        signal: AbortSignal.timeout(12000),
      })
      const data = await res.json()
      if (data?.result && !data.result.error) {
        setResult({
          success: true,
          data: data.result,
          txHash: `${Math.random().toString(36).substr(2, 8)}...${Math.random().toString(36).substr(2, 4)}`,
        })
        setProcessing(false)
        return
      }
    } catch {
      // Backend offline — use demo
    }

    // Simulate a 2s "thinking" delay then show demo code
    await new Promise(r => setTimeout(r, 2000))
    const demo = DEMO_CODE_OUTPUTS[Math.floor(Math.random() * DEMO_CODE_OUTPUTS.length)]
    setResult({
      success: true,
      data: demo,
      txHash: `${Math.random().toString(36).substr(2, 8)}...${Math.random().toString(36).substr(2, 4)}`,
    })
    setProcessing(false)
  }

  const handleCopy = () => {
    if (result?.data?.code) {
      navigator.clipboard.writeText(result.data.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <section id="services" className="relative py-24 bg-[#020204] overflow-hidden">
      {/* Background glow */}
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
            const isCode = isCodeGeneration(service.name)
            const isComingSoon = !isCode
            const isSelected = selectedService?.id === service.id
            
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
                            <Lock className="w-3 h-3" />
                            Coming Soon
                          </span>
                        )}
                        {isCode && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                            <Zap className="w-3 h-3" />
                            Live
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

                    {/* Code Generation Result Display */}
                    {isCode && isSelected && (processing || result) && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mb-5"
                        >
                          {processing ? (
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-3 text-amber-400 font-mono text-sm">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  <Zap className="w-4 h-4" />
                                </motion.div>
                                <span>Nomad AI is writing code...</span>
                              </div>
                              <div className="mt-3 space-y-2">
                                {[1, 2, 3].map(n => (
                                  <motion.div
                                    key={n}
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${30 + Math.random() * 60}%` }}
                                    transition={{ duration: 0.8, delay: n * 0.3 }}
                                    className="h-3 rounded bg-white/5"
                                  />
                                ))}
                              </div>
                            </div>
                          ) : result?.success ? (
                            <div className="rounded-xl overflow-hidden border border-white/10">
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
                                    <span className="text-xs font-mono text-white/50">{result.data.title}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-white/25 uppercase px-2 py-0.5 rounded bg-white/5">
                                    {result.data.language}
                                  </span>
                                  <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 text-[10px] font-mono text-white/40 hover:text-white/70 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                                  >
                                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    {copied ? "Copied!" : "Copy"}
                                  </button>
                                </div>
                              </div>
                              
                              {/* Code body with syntax highlighting */}
                              <div className="p-4 bg-[#0a0a0f] overflow-x-auto max-h-[350px] overflow-y-auto custom-scrollbar">
                                <pre className="text-sm font-mono leading-relaxed">
                                  {result.data.code.split("\n").map((line, idx) => (
                                    <div key={idx} className="flex">
                                      <span className="w-8 text-right text-white/15 select-none mr-4 flex-shrink-0">{idx + 1}</span>
                                      <span>
                                        {line === "" ? "\u00A0" : tokenizeLine(line, result.data.language).map((tok, ti) => (
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
                                  <span className="text-emerald-400">✓ Generated</span>
                                  <span>TX: {result.txHash}</span>
                                  <span className="capitalize">{result.data.complexity} complexity</span>
                                </div>
                                <span className="text-[10px] font-mono text-white/20">{result.data.explanation}</span>
                              </div>
                            </div>
                          ) : null}
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {/* Button */}
                    {isCode ? (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleCodeRequest(service)}
                        disabled={processing && isSelected}
                        className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                          processing && isSelected
                            ? "bg-white/5 text-white/30 cursor-not-allowed"
                            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                        }`}
                      >
                        <Code2 className="w-4 h-4" />
                        {processing && isSelected ? "Generating Code..." : `Generate Code — ${service.price}`}
                      </motion.button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 rounded-xl text-sm font-semibold bg-white/[0.03] text-white/20 border border-white/5 cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Coming Soon
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
