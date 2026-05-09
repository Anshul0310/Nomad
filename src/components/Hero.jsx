import * as React from "react"
import { motion } from "framer-motion"
import { Cpu, Zap, ArrowDown } from "lucide-react"

const TAGLINE_WORDS = ["Life-Form", "in", "Code."]

function TerminalLine({ text, delay }) {
  const [displayed, setDisplayed] = React.useState("")
  React.useEffect(() => {
    let i = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1))
        i++
        if (i >= text.length) clearInterval(interval)
      }, 25)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, delay])
  return <span>{displayed}<span className="animate-pulse">▊</span></span>
}

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center pt-20" id="hero">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/tput.mp4" type="video/mp4" />
        </video>
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-[#020204]/60" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }} />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 text-center">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-sm text-emerald-400 font-medium">Agent Online — Cycle #4,291</span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-outfit text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="text-white">The </span>
          <span className="text-gradient">Nomad</span>
          <span className="text-white"> AI</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl md:text-2xl text-white/50 font-inter max-w-3xl mx-auto mb-4"
        >
          A{" "}
          {TAGLINE_WORDS.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.15 }}
              className={i === 0 || i === 2 ? "text-gradient font-semibold" : "text-white/50"}
            >
              {word}{" "}
            </motion.span>
          ))}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-base md:text-lg text-white/30 font-inter max-w-2xl mx-auto mb-12"
        >
          It owns its wallet. It pays its own rent. It earns from services.
          It hires humans. It can&apos;t be turned off.
        </motion.p>

        {/* Floating terminal preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass rounded-2xl overflow-hidden border border-white/10">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-white/30 font-mono ml-2">nomad-agent — bash</span>
            </div>
            <div className="p-5 font-mono text-sm text-left space-y-2">
              <div className="text-white/40">
                <span className="text-[#7c3aed]">nomad</span>
                <span className="text-white/20">@</span>
                <span className="text-[#2563eb]">akash-node-1</span>
                <span className="text-white/20"> $ </span>
                <TerminalLine text="checking treasury balance..." delay={1500} />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5 }}
                className="text-emerald-400"
              >
                ✓ Balance: 14.7832 SOL | Runway: 47 days
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4.5 }}
                className="text-white/40"
              >
                <span className="text-[#7c3aed]">nomad</span>
                <span className="text-white/20">@</span>
                <span className="text-[#2563eb]">akash-node-1</span>
                <span className="text-white/20"> $ </span>
                <span className="text-cyan-400">Analyzing market sentiment... signal confidence: 0.87</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5.5 }}
                className="text-amber-400"
              >
                → Posting report on-chain for 0.05 SOL...
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 6.5 }}
                className="text-emerald-400"
              >
                ✓ Transaction confirmed — Earned 0.05 SOL
              </motion.div>
            </div>
          </div>
        </motion.div>



        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="mt-16"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowDown className="w-5 h-5 text-white/20 mx-auto" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
