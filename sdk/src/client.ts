/**
 * Nomad Treasury — TypeScript Client
 * For the React dashboard to read the AI's on-chain state.
 */
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  AccountInfo,
} from "@solana/web3.js";
import {
  HealthStatus,
  BountyDisplay,
  BountyStatus,
  NomadConfig,
  lamportsToSol,
} from "./types";

const DEFAULT_CONFIG: NomadConfig = {
  network: "devnet",
  rpcUrl: "https://api.devnet.solana.com",
  wsUrl: "wss://api.devnet.solana.com",
  programId: "Cm9ugYjV24DuiizVUNvAtKoQfq2fZRNqMtLWTezFoDSP",
  bountyThresholdSol: 10,
  dailyRentSol: 0.5,
};

export class NomadTreasuryClient {
  private connection: Connection;
  private programId: PublicKey;
  private config: NomadConfig;
  private _subscriptionId: number | null = null;

  constructor(config?: Partial<NomadConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connection = new Connection(this.config.rpcUrl, {
      wsEndpoint: this.config.wsUrl,
      commitment: "confirmed",
    });
    this.programId = new PublicKey(this.config.programId);
  }

  // ── PDA Derivation ──────────────────────────────────────

  getTreasuryPDA(authority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), authority.toBuffer()],
      this.programId
    );
  }

  getBountyPDA(
    treasuryPubkey: PublicKey,
    bountyId: number
  ): [PublicKey, number] {
    const idBuffer = Buffer.alloc(8);
    idBuffer.writeBigUInt64LE(BigInt(bountyId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from("bounty"), treasuryPubkey.toBuffer(), idBuffer],
      this.programId
    );
  }

  // ── Read Methods ────────────────────────────────────────

  async getWalletBalance(address: string): Promise<number> {
    const pubkey = new PublicKey(address);
    const balance = await this.connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  }

  async getHealthStatus(authorityAddress: string): Promise<HealthStatus> {
    const authority = new PublicKey(authorityAddress);
    const balance = await this.connection.getBalance(authority);
    const balanceSol = balance / LAMPORTS_PER_SOL;
    const dailyRent = this.config.dailyRentSol;
    const runwayDays = dailyRent > 0 ? balanceSol / dailyRent : Infinity;

    let status: HealthStatus["status"] = "critical";
    if (runwayDays > 30) status = "thriving";
    else if (runwayDays > 7) status = "stable";
    else if (runwayDays > 3) status = "surviving";

    return {
      walletAddress: authorityAddress,
      balanceSol,
      balanceLamports: BigInt(balance),
      runwayDays: Math.round(runwayDays * 100) / 100,
      status,
      totalEarnedSol: 0, // TODO: Read from treasury PDA
      totalSpentSol: 0,
      bountyCount: 0,
      canCreateBounty: balanceSol >= this.config.bountyThresholdSol,
      serverUptime: 0,
      lastUpdated: Date.now(),
    };
  }

  // ── Real-time Subscriptions ─────────────────────────────

  subscribeToBalance(
    address: string,
    callback: (balanceSol: number) => void
  ): void {
    const pubkey = new PublicKey(address);
    this._subscriptionId = this.connection.onAccountChange(
      pubkey,
      (accountInfo: AccountInfo<Buffer>) => {
        callback(accountInfo.lamports / LAMPORTS_PER_SOL);
      },
      "confirmed"
    );
  }

  async unsubscribe(): Promise<void> {
    if (this._subscriptionId !== null) {
      await this.connection.removeAccountChangeListener(this._subscriptionId);
      this._subscriptionId = null;
    }
  }

  // ── Utility ─────────────────────────────────────────────

  getExplorerUrl(address: string, type: "address" | "tx" = "address"): string {
    const base = "https://explorer.solana.com";
    const cluster =
      this.config.network === "mainnet-beta" ? "" : `?cluster=${this.config.network}`;
    return `${base}/${type}/${address}${cluster}`;
  }
}

export { DEFAULT_CONFIG };
export * from "./types";
