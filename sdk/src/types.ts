/**
 * Nomad Treasury — TypeScript Types
 * Matches the on-chain account structures from the Anchor program.
 */

// ── Account Types ───────────────────────────────────────────

export interface Treasury {
  authority: string;
  balanceThreshold: bigint;
  totalEarned: bigint;
  totalSpent: bigint;
  bountyCount: bigint;
  dailyRentLamports: bigint;
  bump: number;
}

export type BountyStatus = "open" | "claimed" | "completed" | "cancelled";

export interface Bounty {
  treasury: string;
  bountyId: bigint;
  title: string;
  description: string;
  rewardLamports: bigint;
  status: BountyStatus;
  hunter: string | null;
  createdAt: bigint;
  bump: number;
}

// ── Dashboard Types ─────────────────────────────────────────

export interface HealthStatus {
  walletAddress: string;
  balanceSol: number;
  balanceLamports: bigint;
  runwayDays: number;
  status: "thriving" | "stable" | "surviving" | "critical";
  totalEarnedSol: number;
  totalSpentSol: number;
  bountyCount: number;
  canCreateBounty: boolean;
  serverUptime: number;
  lastUpdated: number;
}

export interface BountyDisplay {
  id: number;
  title: string;
  description: string;
  rewardSol: number;
  status: BountyStatus;
  hunterAddress: string | null;
  createdAt: Date;
  address: string;
}

export interface FinancialBreakdown {
  reserveFundSol: number;
  rentFundSol: number;
  bountyFundSol: number;
  dailyRentSol: number;
  runwayDays: number;
}

// ── Event Types ─────────────────────────────────────────────

export interface PaymentReceivedEvent {
  sender: string;
  amountSol: number;
  amountLamports: bigint;
  signature: string;
  timestamp: number;
  slot: number;
}

export interface BountyCreatedEvent {
  bountyId: number;
  title: string;
  rewardSol: number;
  transactionSignature: string;
}

// ── Config Types ────────────────────────────────────────────

export interface NomadConfig {
  network: "devnet" | "testnet" | "mainnet-beta";
  rpcUrl: string;
  wsUrl: string;
  programId: string;
  bountyThresholdSol: number;
  dailyRentSol: number;
}

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function lamportsToSol(lamports: bigint | number): number {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * LAMPORTS_PER_SOL));
}
