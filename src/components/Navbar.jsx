import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/ui/logo"
import { Wallet, Activity, ShoppingBag, Award, BarChart3, Menu, X, ChevronDown, Globe } from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "#dashboard", icon: BarChart3 },
  { label: "Activity", href: "#activity", icon: Activity },
  { label: "Services", href: "#services", icon: ShoppingBag },
  { label: "Bounties", href: "#bounties", icon: Award },
]

const NETWORKS = [
  { id: "devnet",  label: "Devnet",  color: "text-emerald-400", dot: "bg-emerald-400" },
  { id: "testnet", label: "Testnet", color: "text-amber-400",   dot: "bg-amber-400"   },
  { id: "mainnet", label: "Mainnet", color: "text-rose-400",    dot: "bg-rose-400"     },
]

export function Navbar() {
  const [walletConnected, setWalletConnected] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [networkDropdown, setNetworkDropdown] = React.useState(false)
  const [currentNetwork, setCurrentNetwork] = React.useState("devnet")
  const [switching, setSwitching] = React.useState(false)
  const dropdownRef = React.useRef(null)

  const activeNet = NETWORKS.find(n => n.id === currentNetwork) || NETWORKS[0]

  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNetworkDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleNetworkSwitch = async (net) => {
    if (net === currentNetwork) {
      setNetworkDropdown(false)
      return
    }
    setSwitching(true)
    setCurrentNetwork(net)
    setNetworkDropdown(false)

    // Try to tell backend (silently fails if backend is offline)
    try {
      await fetch(`http://localhost:8000/api/network/${net}`, { method: "POST", signal: AbortSignal.timeout(3000) })
    } catch {
      // Backend offline — that's fine, the UI still reflects the selection
    }
    setSwitching(false)
  }

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
    >
      <nav className={`w-full max-w-7xl flex items-center justify-between rounded-2xl px-5 py-3 transition-all duration-500 ${
        scrolled 
          ? "bg-[#050505]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
          : "bg-[#050505]/60 backdrop-blur-xl border border-white/5"
      }`}>
        <Logo />
        
        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-300"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Network Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setNetworkDropdown(!networkDropdown)}
              disabled={switching}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 text-white/80"
            >
              <span className={`w-2 h-2 rounded-full ${activeNet.dot} ${switching ? "animate-pulse" : ""}`} />
              <span className="hidden sm:inline">
                {switching ? "Switching..." : activeNet.label}
              </span>
              <Globe className={`sm:hidden w-4 h-4 ${activeNet.color}`} />
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${networkDropdown ? "rotate-180" : ""}`} />
            </button>
            
            <AnimatePresence>
              {networkDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-44 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-50 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                >
                  <div className="p-1">
                    {NETWORKS.map((net) => (
                      <button
                        key={net.id}
                        onClick={() => handleNetworkSwitch(net.id)}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-3 transition-all duration-150 ${
                          currentNetwork === net.id 
                            ? "bg-white/10 text-white font-medium" 
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${net.dot}`} />
                        <span className="flex-1">{net.label}</span>
                        {currentNetwork === net.id && (
                          <span className="text-xs text-white/40">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/5 px-3 py-2">
                    <p className="text-[10px] text-white/25 font-mono">
                      RPC: api.{currentNetwork}.solana.com
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wallet connect */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setWalletConnected(!walletConnected)}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              walletConnected
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            }`}
          >
            <Wallet className="w-4 h-4" />
            {walletConnected ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                7xKp...9mNz
              </span>
            ) : (
              "Connect Wallet"
            )}
          </motion.button>

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-white/70 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-4 right-4 mt-2 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 md:hidden"
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 text-white/70 hover:text-white px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </a>
            ))}
            <div className="pt-3 border-t border-white/10 mt-2">
              <p className="text-xs text-white/40 mb-2 px-2 uppercase tracking-wider font-medium">Network</p>
              <div className="flex gap-2 mb-4 px-2">
                {NETWORKS.map((net) => (
                  <button
                    key={net.id}
                    onClick={() => handleNetworkSwitch(net.id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      currentNetwork === net.id 
                        ? "bg-white/15 text-white border border-white/10" 
                        : "bg-white/5 text-white/40 hover:text-white/70"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${net.dot}`} />
                    {net.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setWalletConnected(!walletConnected); setMobileOpen(false) }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white"
              >
                <Wallet className="w-4 h-4" />
                {walletConnected ? "Disconnect" : "Connect Wallet"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
