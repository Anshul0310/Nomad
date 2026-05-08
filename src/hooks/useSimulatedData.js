import { useState, useEffect } from "react"

// --- Simulated Wallet & Treasury Data ---
const INITIAL_BALANCE = 14.7832
const INITIAL_EARNINGS = 2.341

const activityTemplates = [
  { type: "earn", messages: [
    "Earned 0.05 SOL — sentiment analysis report delivered",
    "Earned 0.12 SOL — AI-generated image sold to user",
    "Earned 0.03 SOL — data analysis task completed",
    "Earned 0.08 SOL — content moderation service rendered",
    "Earned 0.15 SOL — trading signal report purchased",
    "Earned 0.02 SOL — API call from external dApp",
  ]},
  { type: "spend", messages: [
    "Paid 0.004 SOL — Akash compute rent (hourly)",
    "Paid 0.001 SOL — Solana transaction fee",
    "Paid 0.006 SOL — Akash GPU instance renewal",
    "Paid 0.002 SOL — on-chain state update",
  ]},
  { type: "decision", messages: [
    "Decision: Reallocating 5% treasury to high-yield strategy",
    "Decision: Scaling compute — spinning up 2nd Akash node",
    "Decision: Identified profitable sentiment arbitrage opportunity",
    "Decision: Posting new bounty for frontend bug fix",
    "Decision: Runway check passed — 47 days remaining",
  ]},
  { type: "system", messages: [
    "Health check: All systems operational ✓",
    "Akash node heartbeat received — latency 23ms",
    "Wallet balance checkpoint — above safety threshold",
    "LangGraph agent cycle #4,291 completed",
    "Smart contract audit — no anomalies detected",
  ]},
]

function getRandomActivity() {
  const category = activityTemplates[Math.floor(Math.random() * activityTemplates.length)]
  const message = category.messages[Math.floor(Math.random() * category.messages.length)]
  return {
    id: Date.now() + Math.random(),
    type: category.type,
    message,
    timestamp: new Date(),
  }
}

export function useSimulatedWallet() {
  const [balance, setBalance] = useState(INITIAL_BALANCE)
  const [totalEarned, setTotalEarned] = useState(INITIAL_EARNINGS)
  const [totalSpent, setTotalSpent] = useState(0.892)
  const [runway, setRunway] = useState(47)
  const [uptime, setUptime] = useState(99.97)
  const [txCount, setTxCount] = useState(4291)

  useEffect(() => {
    const interval = setInterval(() => {
      const isEarning = Math.random() > 0.35
      const amount = isEarning
        ? (Math.random() * 0.08 + 0.01)
        : (Math.random() * 0.005 + 0.001)
      
      setBalance(prev => {
        const next = isEarning ? prev + amount : prev - amount
        return Math.max(0, parseFloat(next.toFixed(4)))
      })
      
      if (isEarning) {
        setTotalEarned(prev => parseFloat((prev + amount).toFixed(4)))
      } else {
        setTotalSpent(prev => parseFloat((prev + amount).toFixed(4)))
      }
      
      setTxCount(prev => prev + 1)
      setRunway(prev => Math.max(1, prev + (isEarning ? 0.1 : -0.05)))
      setUptime(prev => {
        const next = prev + (Math.random() * 0.002 - 0.001)
        return Math.min(100, Math.max(99.9, parseFloat(next.toFixed(2))))
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return { balance, totalEarned, totalSpent, runway: Math.floor(runway), uptime, txCount }
}

export function useSimulatedActivity() {
  const [activities, setActivities] = useState(() => {
    const initial = []
    for (let i = 0; i < 8; i++) {
      const a = getRandomActivity()
      a.timestamp = new Date(Date.now() - (8 - i) * 5000)
      a.id = i
      initial.push(a)
    }
    return initial
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => {
        const next = [getRandomActivity(), ...prev]
        return next.slice(0, 50)
      })
    }, 4000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [])

  return activities
}

export function useSimulatedBounties() {
  const [bounties] = useState(() => [
    {
      id: 1,
      title: "Fix WebSocket reconnection logic",
      description: "The agent's WS connection to Akash drops after 24h. Need auto-reconnect with exponential backoff.",
      reward: "2.5 SOL",
      difficulty: "Medium",
      status: "open",
      postedAt: new Date(Date.now() - 86400000 * 2),
      tags: ["Backend", "Infrastructure"],
    },
    {
      id: 2,
      title: "Implement sentiment analysis pipeline",
      description: "Build a pipeline that analyzes crypto Twitter sentiment and generates trading signals with confidence scores.",
      reward: "5.0 SOL",
      difficulty: "Hard",
      status: "open",
      postedAt: new Date(Date.now() - 86400000),
      tags: ["AI/ML", "Python"],
    },
    {
      id: 3,
      title: "Dashboard mobile responsiveness",
      description: "Make the Nomad AI dashboard fully responsive on mobile devices. All panels must be usable.",
      reward: "1.5 SOL",
      difficulty: "Easy",
      status: "claimed",
      claimedBy: "7xKp...9mNz",
      postedAt: new Date(Date.now() - 86400000 * 3),
      tags: ["Frontend", "React"],
    },
    {
      id: 4,
      title: "Anchor smart contract upgrade",
      description: "Upgrade the Bounty program to support milestone-based payouts and multi-sig approval.",
      reward: "8.0 SOL",
      difficulty: "Hard",
      status: "open",
      postedAt: new Date(Date.now() - 3600000 * 6),
      tags: ["Solana", "Anchor"],
    },
    {
      id: 5,
      title: "Add Prometheus metrics endpoint",
      description: "Expose agent health metrics (CPU, memory, decision latency) via Prometheus-compatible endpoint.",
      reward: "1.0 SOL",
      difficulty: "Easy",
      status: "completed",
      completedBy: "3bRt...xH2q",
      postedAt: new Date(Date.now() - 86400000 * 5),
      tags: ["DevOps", "Monitoring"],
    },
  ])

  return bounties
}

export function useSimulatedServices() {
  const [services] = useState([
    {
      id: 1,
      name: "Sentiment Analysis",
      description: "AI analyzes crypto market sentiment from Twitter, Reddit, and news. Returns a confidence-scored trading signal.",
      price: "0.05 SOL",
      icon: "brain",
      avgTime: "~30s",
      totalCalls: 1247,
    },
    {
      id: 2,
      name: "AI Image Generation",
      description: "Generate high-quality images from text prompts using the Nomad AI's compute infrastructure.",
      price: "0.12 SOL",
      icon: "image",
      avgTime: "~45s",
      totalCalls: 893,
    },
    {
      id: 3,
      name: "Data Analysis Report",
      description: "Upload a dataset and receive a comprehensive statistical analysis with visualizations and insights.",
      price: "0.08 SOL",
      icon: "chart",
      avgTime: "~2min",
      totalCalls: 412,
    },
    {
      id: 4,
      name: "Smart Contract Audit",
      description: "Automated security analysis of Solana programs. Identifies common vulnerabilities and suggests fixes.",
      price: "0.25 SOL",
      icon: "shield",
      avgTime: "~5min",
      totalCalls: 156,
    },
  ])

  return services
}

// Simulated chart data for balance history
export function useBalanceHistory() {
  const [history, setHistory] = useState(() => {
    const points = []
    let val = 10.5
    for (let i = 30; i >= 0; i--) {
      val += (Math.random() - 0.35) * 0.5
      val = Math.max(5, val)
      points.push({
        day: `Day ${30 - i}`,
        balance: parseFloat(val.toFixed(2)),
      })
    }
    return points
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const lastVal = prev[prev.length - 1].balance
        const newVal = lastVal + (Math.random() - 0.35) * 0.3
        const next = [...prev.slice(1), {
          day: `Day ${parseInt(prev[prev.length - 1].day.split(" ")[1]) + 1}`,
          balance: parseFloat(Math.max(5, newVal).toFixed(2)),
        }]
        return next
      })
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return history
}
