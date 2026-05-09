import * as React from "react"
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js"

/**
 * Wallet context — connects to Phantom via window.solana
 * and provides balance, address, and network info to the entire app.
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

  // Fetch balance when connected
  const fetchBalance = React.useCallback(async () => {
    if (!publicKey || !connection) return
    try {
      const lamports = await connection.getBalance(publicKey)
      setBalance(lamports / LAMPORTS_PER_SOL)
    } catch (err) {
      console.warn("Failed to fetch balance:", err)
    }
  }, [publicKey, connection])

  // Poll balance every 10s
  React.useEffect(() => {
    if (!connected || !publicKey) return
    fetchBalance()
    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [connected, publicKey, fetchBalance])

  // Re-fetch on network change
  React.useEffect(() => {
    if (connected && publicKey) fetchBalance()
  }, [network, connected, publicKey, fetchBalance])

  const connect = async () => {
    const provider = window?.solana
    if (!provider?.isPhantom) {
      window.open("https://phantom.app/", "_blank")
      return
    }

    setConnecting(true)
    try {
      const resp = await provider.connect()
      setPublicKey(resp.publicKey)
      setConnected(true)
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
      } else {
        disconnect()
      }
    }
    provider.on("accountChanged", onAccountChange)
    return () => provider.off("accountChanged", onAccountChange)
  }, [])

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
