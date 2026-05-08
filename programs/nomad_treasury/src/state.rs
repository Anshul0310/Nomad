use anchor_lang::prelude::*;

/// The AI's central treasury account.
/// Stores financial state and controls bounty creation.
#[account]
#[derive(InitSpace)]
pub struct Treasury {
    /// The authority (AI's keypair) that controls this treasury
    pub authority: Pubkey,

    /// Minimum lamports required before a bounty can be created (default: 10 SOL)
    pub balance_threshold: u64,

    /// Total lamports earned by the AI across its lifetime
    pub total_earned: u64,

    /// Total lamports spent by the AI (bounties + infrastructure)
    pub total_spent: u64,

    /// Number of bounties created so far (used as incrementing ID)
    pub bounty_count: u64,

    /// Daily server rent cost in lamports (for runway calculations)
    pub daily_rent_lamports: u64,

    /// PDA bump seed
    pub bump: u8,
}

/// Status of a bounty posted by the AI
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum BountyStatus {
    /// Open for developers to claim
    Open,
    /// A developer has claimed this bounty and is working on it
    Claimed,
    /// Work completed and payment sent
    Completed,
    /// Bounty was cancelled by the AI
    Cancelled,
}

/// A bounty posted on-chain by the AI to hire human developers.
#[account]
#[derive(InitSpace)]
pub struct Bounty {
    /// The treasury that created this bounty
    pub treasury: Pubkey,

    /// Unique bounty ID (auto-incremented from treasury.bounty_count)
    pub bounty_id: u64,

    /// Short title of the task
    #[max_len(64)]
    pub title: String,

    /// Detailed description of what needs to be done
    #[max_len(256)]
    pub description: String,

    /// Reward amount in lamports
    pub reward_lamports: u64,

    /// Current status of this bounty
    pub status: BountyStatus,

    /// The developer who claimed/completed this bounty
    pub hunter: Option<Pubkey>,

    /// Unix timestamp when this bounty was created
    pub created_at: i64,

    /// PDA bump seed
    pub bump: u8,
}
