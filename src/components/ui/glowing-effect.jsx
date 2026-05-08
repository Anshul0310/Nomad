import * as React from "react"
import { cn } from "@/lib/utils"

export function GlowingEffect({ children, className }) {
  const containerRef = React.useRef(null)

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    containerRef.current.style.setProperty("--mouse-x", `${x}px`)
    containerRef.current.style.setProperty("--mouse-y", `${y}px`)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative group overflow-hidden rounded-xl border border-white/10 bg-[#050505] glass",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(124, 58, 237, 0.15), transparent 40%)`,
        }}
      />
       <div
        className="absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(124, 58, 237, 0.4), transparent 40%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
          borderRadius: "inherit"
        }}
      />
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  )
}
