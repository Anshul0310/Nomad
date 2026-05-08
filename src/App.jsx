import * as React from "react"
import { Navbar } from "./components/Navbar"
import { Hero } from "./components/Hero"
import { HealthPanel } from "./components/HealthPanel"
import { ActivityFeed } from "./components/ActivityFeed"
import { ServiceInteraction } from "./components/ServiceInteraction"
import { BountyBoard } from "./components/BountyBoard"
import { EconomicFlywheel } from "./components/EconomicFlywheel"
import { Footer } from "./components/Footer"

function App() {
  return (
    <div className="bg-[#020204] text-white min-h-screen font-inter selection:bg-[#7c3aed]/30">
      <Navbar />
      <Hero />
      <HealthPanel />
      <ActivityFeed />
      <EconomicFlywheel />
      <ServiceInteraction />
      <BountyBoard />
      <Footer />
    </div>
  )
}

export default App
