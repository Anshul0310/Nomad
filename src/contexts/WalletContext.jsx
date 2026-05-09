import * as React from "react"
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js"

/**
 * Wallet context — connects to Phantom via window.solana
 * and provides balance, address, and network info to the entire app.
 * Auto-detects which network has SOL.
 */

const WalletContext = React.createContext({
  connected: false,
  connecting: false,
  publicKey: null,
  address: "",
  shortAddress: "",
  balance: null,
  network: "devnet",
  connect: async () => {},
  disconnect: () => {},
  setNetwork: () => {},
  connection: null,
})

export function useWallet() {
  return React.useContext(WalletContext)
}

const RPC_URLS = {
  devnet: clusterApiUrl("devnet"),
  testnet: clusterApiUrl("testnet"),
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
}

export function WalletProvider({ children }) {
  const [connected, setConnected] = React.useState(false)
  const [connecting, setConnecting] = React.useState(false)
  const [publicKey, setPublicKey] = React.useState(null)
  const [balance, setBalance] = React.useState(null)
  const [network, setNetwork] = React.useState("devnet")

  const connection = React.useMemo(
    () => new Connection(RPC_URLS[network] || RPC_URLS.devnet, "confirmed"),
    [network]
  )

  const address = publicKey ? publicKey.toBase58() : ""
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : ""

  // Fetch balance on current network
  const fetchBalance = React.useCallback(async () => {
    if (!publicKey) return
    try {
      const conn = new Connection(RPC_URLS[network] || RPC_URLS.devnet, "confirmed")
      const lamports = await conn.getBalance(publicKey)
      const sol = lamports / LAMPORTS_PER_SOL
      console.log(`[Wallet] Balance on ${network}: ${sol} SOL`)
      setBalance(sol)
    } catch (err) {
      console.warn(`[Wallet] Failed to fetch balance on ${network}:`, err.message)
      setBalance(0)
    }
  }, [publicKey, network])

  // When wallet first connects, scan all networks to find SOL
  const detectBestNetwork = React.useCallback(async (pk) => {
    if (!pk) return
    console.log("[Wallet] Scanning all networks for SOL...")

    const results = []
    for (const [net, url] of Object.entries(RPC_URLS)) {
      try {
        const conn = new Connection(url, "confirmed")
        const lamports = await conn.getBalance(pk)
        const sol = lamports / LAMPORTS_PER_SOL
        console.log(`[Wallet] ${net}: ${sol} SOL`)
        results.push({ net, sol })
      } catch (err) {
        console.warn(`[Wallet] ${net} failed:`, err.message)
        results.push({ net, sol: 0 })
      }
    }

    // Pick the network with the most SOL
    results.sort((a, b) => b.sol - a.sol)
    const best = results[0]
    if (best && best.sol > 0) {
      console.log(`[Wallet] Best network: ${best.net} with ${best.sol} SOL`)
      setNetwork(best.net)
      setBalance(best.sol)
    } else {
      // Default to devnet, show 0
      console.log("[Wallet] No SOL found on any network, defaulting to devnet")
      setBalance(0)
    }
  }, [])

  // Poll balance every 10s
  React.useEffect(() => {
    if (!connected || !publicKey) return
    fetchBalance()
    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [connected, publicKey, fetchBalance])

  const connect = async () => {
    const provider = window?.solana
    if (!provider?.isPhantom) {
      window.open("https://phantom.app/", "_blank")
      return
    }

    setConnecting(true)
    try {
      const resp = await provider.connect()
      const pk = resp.publicKey
      console.log("[Wallet] Connected:", pk.toBase58())
      setPublicKey(pk)
      setConnected(true)
      // Auto-detect best network
      await detectBestNetwork(pk)
    } catch (err) {
      console.error("Wallet connection failed:", err)
    }
    setConnecting(false)
  }

  const disconnect = () => {
    const provider = window?.solana
    if (provider) {
      try { provider.disconnect() } catch {}
    }
    setPublicKey(null)
    setBalance(null)
    setConnected(false)
  }

  // Listen for account changes
  React.useEffect(() => {
    const provider = window?.solana
    if (!provider) return

    const onAccountChange = (pk) => {
      if (pk) {
        setPublicKey(pk)
        setConnected(true)
        detectBestNetwork(pk)
      } else {
        disconnect()
      }
    }
    provider.on("accountChanged", onAccountChange)
    return () => provider.off("accountChanged", onAccountChange)
  }, [detectBestNetwork])

  // Try to eagerly connect (auto-reconnect if previously approved)
  React.useEffect(() => {
    const tryEagerConnect = async () => {
      const provider = window?.solana
      if (!provider?.isPhantom) return
      try {
        const resp = await provider.connect({ onlyIfTrusted: true })
        const pk = resp.publicKey
        console.log("[Wallet] Eager reconnect:", pk.toBase58())
        setPublicKey(pk)
        setConnected(true)
        await detectBestNetwork(pk)
      } catch {
        // User hasn't approved before — that's fine
      }
    }
    tryEagerConnect()
  }, [detectBestNetwork])

  const value = {
    connected,
    connecting,
    publicKey,
    address,
    shortAddress,
    balance,
    network,
    connect,
    disconnect,
    setNetwork,
    connection,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
