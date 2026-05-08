import * as React from "react"
import { motion } from "framer-motion"
import { useSimulatedServices } from "@/hooks/useSimulatedData"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Brain, Image, BarChart3, Shield, Zap, Clock, Users, Wallet } from "lucide-react"

const iconMap = {
  brain: Brain,
  image: Image,
  chart: BarChart3,
  shield: Shield,
}

const gradients = [
  "from-[#7c3aed] to-[#2563eb]",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
]

export function ServiceInteraction() {
  const services = useSimulatedServices()
  const [selectedService, setSelectedService] = React.useState(null)
  const [processing, setProcessing] = React.useState(false)
  const [result, setResult] = React.useState(null)

  const handleRequest = (service) => {
    setSelectedService(service)
    setProcessing(true)
    setResult(null)
    
    // Simulate processing
    setTimeout(() => {
      setProcessing(false)
      setResult({
        success: true,
        txHash: `${Math.random().toString(36).substr(2, 8)}...${Math.random().toString(36).substr(2, 4)}`,
        output: service.name === "Sentiment Analysis" 
          ? "BTC sentiment: 0.73 (Bullish) | ETH: 0.61 (Neutral-Bullish) | SOL: 0.82 (Strong Bullish)"
          : "Task completed successfully. Output delivered to your wallet.",
      })
    }, 2500)
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
            const isSelected = selectedService?.id === service.id
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <GlowingEffect className="h-full">
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[i]} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
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

                    {/* Result display */}
                    {isSelected && (processing || result) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mb-4 p-3 rounded-lg bg-white/[0.03] border border-white/5 font-mono text-xs"
                      >
                        {processing ? (
                          <div className="flex items-center gap-2 text-amber-400">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </motion.div>
                            Processing request...
                          </div>
                        ) : result?.success ? (
                          <div className="space-y-1">
                            <div className="text-emerald-400">✓ Complete</div>
                            <div className="text-white/50">TX: {result.txHash}</div>
                            <div className="text-white/70 mt-2 font-inter text-[11px]">{result.output}</div>
                          </div>
                        ) : null}
                      </motion.div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleRequest(service)}
                      disabled={processing && isSelected}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        processing && isSelected
                          ? "bg-white/5 text-white/30 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]"
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      {processing && isSelected ? "Processing..." : `Pay ${service.price}`}
                    </motion.button>
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
