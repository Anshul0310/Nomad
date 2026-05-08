import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function Logo({ className }) {
  const text = "NOMAD"
  
  return (
    <div className={cn("flex items-center space-x-3 group cursor-pointer", className)}>
      <motion.div 
        whileHover={{ rotate: 180, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-[#7c3aed] via-[#2563eb] to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)]"
      >
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="h-3 w-3 bg-white rounded-sm shadow-[0_0_10px_rgba(255,255,255,1)]"
        />
      </motion.div>
      
      <div className="relative flex overflow-hidden">
        {text.split("").map((letter, i) => (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              delay: i * 0.05, 
              type: "spring", 
              stiffness: 200, 
              damping: 10 
            }}
            className="font-outfit font-black text-xl tracking-tighter inline-block"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 group-hover:from-[#7c3aed] group-hover:via-[#2563eb] group-hover:to-cyan-400 bg-[length:200%_auto] animate-gradient transition-all duration-500">
              {letter}
            </span>
          </motion.span>
        ))}
      </div>
    </div>
  )
}
