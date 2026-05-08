import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

export function DarkGradientPricing({
  title,
  price,
  features,
  isHighlighted = false,
  className,
  buttonText = "Get started",
  buttonVariant = "default"
}) {
  return (
    <motion.div
      initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
      whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative flex flex-col p-8 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-black border",
        isHighlighted ? "border-[#7c3aed]/50 shadow-[0_0_30px_rgba(124,58,237,0.2)]" : "border-white/10",
        className
      )}
    >
      {isHighlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white px-3 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-xl font-outfit text-white/80">{title}</h3>
        <div className="mt-4 flex items-baseline text-5xl font-outfit font-bold text-white">
          {price}
          {price !== "Contact us" && <span className="ml-1 text-xl text-white/50 font-inter font-normal">/mo</span>}
        </div>
      </div>

      <ul className="mb-8 space-y-4 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center text-sm text-white/80">
            {feature.included ? (
              <Check className="mr-3 h-5 w-5 text-[#7c3aed]" />
            ) : (
              <X className="mr-3 h-5 w-5 text-white/30" />
            )}
            <span className={cn(!feature.included && "text-white/40")}>{feature.name}</span>
          </li>
        ))}
      </ul>

      <button
        className={cn(
          "w-full rounded-lg py-3 px-4 font-medium transition-all duration-200",
          buttonVariant === "default" 
            ? "bg-white text-black hover:bg-white/90" 
            : buttonVariant === "gradient"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
              : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
        )}
      >
        {buttonText}
      </button>
    </motion.div>
  )
}
