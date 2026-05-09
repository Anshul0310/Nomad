import { useState, useEffect, useCallback } from "react"
import {
  useSimulatedWallet,
  useSimulatedActivity,
  useSimulatedBounties,
  useBalanceHistory,
} from "./useSimulatedData"

import { API_BASE, apiFetch } from "@/lib/apiConfig"


// ── Wallet Data Hook ────────────────────────────────────────────────────────

export function useWalletData() {
  const simulated = useSimulatedWallet()
  const [live, setLive] = useState(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      const data = await apiFetch("/status")
      if (!cancelled && data && data.wallet_balance !== undefined) {
        setLive({
          balance: data.wallet_balance,
          totalEarned: data.total_earned || 0,
          totalSpent: data.total_spent || 0,
          runway: Math.floor((data.runway_hours || 0) / 24) || 1,
          uptime: data.uptime || 99.97,
          txCount: data.tx_count || 0,
          walletAddress: data.wallet_address || "",
          network: data.network || "devnet",
          programId: data.program_id || "",
          status: data.status || "unknown",
          iteration: data.iteration || 0,
        })
        setIsLive(true)
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return isLive ? live : simulated
}

// ── Activity Data Hook ──────────────────────────────────────────────────────

export function useActivityData() {
  const simulated = useSimulatedActivity()
  const [live, setLive] = useState(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      const data = await apiFetch("/activity")
      if (!cancelled && Array.isArray(data) && data.length > 0) {
        setLive(data.map(a => ({
          ...a,
          timestamp: new Date(a.timestamp),
        })))
        setIsLive(true)
      }
    }

    poll()
    const interval = setInterval(poll, 4000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return isLive ? live : simulated
}

// ── Bounty Data Hook ────────────────────────────────────────────────────────

export function useBountyData() {
  const simulated = useSimulatedBounties()
  const [live, setLive] = useState(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      const data = await apiFetch("/bounties")
      if (!cancelled && Array.isArray(data) && data.length > 0) {
        setLive(data)
        setIsLive(true)
      }
    }

    poll()
    const interval = setInterval(poll, 10000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return isLive ? live : simulated
}

// ── Service Trigger Hook ────────────────────────────────────────────────────

export function useServiceTrigger() {
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const trigger = useCallback(async (serviceName) => {
    setLoading(true)
    setLastResult(null)
    try {
      const res = await fetch(`${API_BASE}/service/${serviceName}`, {
        method: "POST",
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json()
      setLastResult(data)
      return data
    } catch (err) {
      const error = { status: "error", error: err.message }
      setLastResult(error)
      return error
    } finally {
      setLoading(false)
    }
  }, [])

  return { trigger, loading, lastResult }
}

// ── Network Switch Hook ─────────────────────────────────────────────────────

export function useNetworkSwitch() {
  const [switching, setSwitching] = useState(false)

  const switchNetwork = useCallback(async (network) => {
    setSwitching(true)
    try {
      const res = await fetch(`${API_BASE}/network/${network}`, {
        method: "POST",
        signal: AbortSignal.timeout(5000),
      })
      return await res.json()
    } catch (err) {
      return { status: "error", error: err.message }
    } finally {
      setSwitching(false)
    }
  }, [])

  return { switchNetwork, switching }
}

// Re-export the chart hook (no API equivalent needed)
export { useBalanceHistory } from "./useSimulatedData"
