import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NomadTreasury } from "../target/types/nomad_treasury";
import { expect } from "chai";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

describe("nomad_treasury", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .NomadTreasury as Program<NomadTreasury>;
  const authority = provider.wallet as anchor.Wallet;
  const hunter = Keypair.generate();

  let treasuryPDA: PublicKey;
  let treasuryBump: number;

  // 10 SOL threshold, 0.5 SOL daily rent
  const balanceThreshold = new anchor.BN(10 * LAMPORTS_PER_SOL);
  const dailyRentLamports = new anchor.BN(0.5 * LAMPORTS_PER_SOL);
  const bountyReward = new anchor.BN(1 * LAMPORTS_PER_SOL);

  before(async () => {
    // Derive treasury PDA
    [treasuryPDA, treasuryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), authority.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop to hunter for transaction fees
    const sig = await provider.connection.requestAirdrop(
      hunter.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);
  });

  it("Initializes the treasury", async () => {
    await program.methods
      .initializeTreasury(balanceThreshold, dailyRentLamports)
      .accounts({
        authority: authority.publicKey,
        treasury: treasuryPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const treasury = await program.account.treasury.fetch(treasuryPDA);
    expect(treasury.authority.toBase58()).to.equal(
      authority.publicKey.toBase58()
    );
    expect(treasury.balanceThreshold.toNumber()).to.equal(
      10 * LAMPORTS_PER_SOL
    );
    expect(treasury.totalEarned.toNumber()).to.equal(0);
    expect(treasury.totalSpent.toNumber()).to.equal(0);
    expect(treasury.bountyCount.toNumber()).to.equal(0);

    console.log("🏛️ Treasury initialized at:", treasuryPDA.toBase58());
  });

  it("Funds the treasury PDA", async () => {
    // Transfer SOL to the treasury PDA to simulate earnings
    const fundAmount = 15 * LAMPORTS_PER_SOL;
    const tx = new anchor.web3.Transaction().add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: treasuryPDA,
        lamports: fundAmount,
      })
    );
    await provider.sendAndConfirm(tx);

    const balance = await provider.connection.getBalance(treasuryPDA);
    console.log(
      "💰 Treasury funded with:",
      balance / LAMPORTS_PER_SOL,
      "SOL"
    );
    expect(balance).to.be.greaterThan(10 * LAMPORTS_PER_SOL);
  });

  it("Creates a bounty", async () => {
    const treasury = await program.account.treasury.fetch(treasuryPDA);
    const bountyId = treasury.bountyCount.toNumber();

    const idBuffer = Buffer.alloc(8);
    idBuffer.writeBigUInt64LE(BigInt(bountyId));
    const [bountyPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bounty"), treasuryPDA.toBuffer(), idBuffer],
      program.programId
    );

    await program.methods
      .createBounty(
        "Fix memory leak in agent",
        "The agent's memory layer has a leak causing OOM after 24h. Fix it.",
        bountyReward
      )
      .accounts({
        authority: authority.publicKey,
        treasury: treasuryPDA,
        bounty: bountyPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPDA);
    expect(bounty.title).to.equal("Fix memory leak in agent");
    expect(bounty.rewardLamports.toNumber()).to.equal(1 * LAMPORTS_PER_SOL);
    expect(bounty.status).to.deep.equal({ open: {} });
    expect(bounty.hunter).to.be.null;

    console.log("🎯 Bounty created at:", bountyPDA.toBase58());
  });

  it("Hunter claims the bounty", async () => {
    const treasury = await program.account.treasury.fetch(treasuryPDA);
    const bountyId = treasury.bountyCount.toNumber() - 1;

    const idBuffer = Buffer.alloc(8);
    idBuffer.writeBigUInt64LE(BigInt(bountyId));
    const [bountyPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bounty"), treasuryPDA.toBuffer(), idBuffer],
      program.programId
    );

    await program.methods
      .claimBounty()
      .accounts({
        hunter: hunter.publicKey,
        treasury: treasuryPDA,
        bounty: bountyPDA,
      })
      .signers([hunter])
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPDA);
    expect(bounty.status).to.deep.equal({ claimed: {} });
    expect(bounty.hunter.toBase58()).to.equal(hunter.publicKey.toBase58());

    console.log("🏹 Bounty claimed by:", hunter.publicKey.toBase58());
  });

  it("Completes the bounty and pays the hunter", async () => {
    const treasury = await program.account.treasury.fetch(treasuryPDA);
    const bountyId = treasury.bountyCount.toNumber() - 1;

    const idBuffer = Buffer.alloc(8);
    idBuffer.writeBigUInt64LE(BigInt(bountyId));
    const [bountyPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bounty"), treasuryPDA.toBuffer(), idBuffer],
      program.programId
    );

    const hunterBalanceBefore = await provider.connection.getBalance(
      hunter.publicKey
    );

    await program.methods
      .completeBounty()
      .accounts({
        authority: authority.publicKey,
        treasury: treasuryPDA,
        bounty: bountyPDA,
        hunter: hunter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPDA);
    expect(bounty.status).to.deep.equal({ completed: {} });

    const hunterBalanceAfter = await provider.connection.getBalance(
      hunter.publicKey
    );
    expect(hunterBalanceAfter - hunterBalanceBefore).to.equal(
      1 * LAMPORTS_PER_SOL
    );

    console.log(
      "✅ Bounty completed! Hunter received:",
      (hunterBalanceAfter - hunterBalanceBefore) / LAMPORTS_PER_SOL,
      "SOL"
    );
  });

  it("Withdraws SOL for Akash rent", async () => {
    const destination = Keypair.generate();

    // Fund destination so it exists
    const fundSig = await provider.connection.requestAirdrop(
      destination.publicKey,
      0.01 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(fundSig);

    const withdrawAmount = new anchor.BN(0.5 * LAMPORTS_PER_SOL);

    const destBalanceBefore = await provider.connection.getBalance(
      destination.publicKey
    );

    await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        authority: authority.publicKey,
        treasury: treasuryPDA,
        destination: destination.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const destBalanceAfter = await provider.connection.getBalance(
      destination.publicKey
    );
    expect(destBalanceAfter - destBalanceBefore).to.equal(
      0.5 * LAMPORTS_PER_SOL
    );

    const treasury = await program.account.treasury.fetch(treasuryPDA);
    expect(treasury.totalSpent.toNumber()).to.be.greaterThan(0);

    console.log("💸 Withdrew 0.5 SOL for Akash rent");
  });
});
