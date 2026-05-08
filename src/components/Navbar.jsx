import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/ui/logo"
import { Wallet, Activity, ShoppingBag, Award, BarChart3, Menu, X } from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "#dashboard", icon: BarChart3 },
  { label: "Activity", href: "#activity", icon: Activity },
  { label: "Services", href: "#services", icon: ShoppingBag },
  { label: "Bounties", href: "#bounties", icon: Award },
]

export function Navbar() {
  const [walletConnected, setWalletConnected] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

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
            <button
              onClick={() => { setWalletConnected(!walletConnected); setMobileOpen(false) }}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white"
            >
              <Wallet className="w-4 h-4" />
              {walletConnected ? "Disconnect" : "Connect Wallet"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
