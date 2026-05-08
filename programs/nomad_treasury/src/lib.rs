use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Cm9ugYjV24DuiizVUNvAtKoQfq2fZRNqMtLWTezFoDSP");

/// # Nomad Treasury
///
/// The on-chain financial backbone of Nomad AI.
/// This program manages the AI's treasury PDA and bounty system,
/// allowing the AI to autonomously earn, spend, and hire.
#[program]
pub mod nomad_treasury {
    use super::*;

    /// Initialize the AI's treasury. Called once at deployment.
    ///
    /// # Arguments
    /// * `balance_threshold` - Minimum lamports before bounties can be created (default: 10 SOL)
    /// * `daily_rent_lamports` - Daily server cost in lamports (for runway calculations)
    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        balance_threshold: u64,
        daily_rent_lamports: u64,
    ) -> Result<()> {
        instructions::initialize_treasury::handler(ctx, balance_threshold, daily_rent_lamports)
    }

    /// Create a new bounty to hire a human developer.
    /// Requires treasury balance to exceed the threshold.
    ///
    /// # Arguments
    /// * `title` - Short task title (max 64 chars)
    /// * `description` - Detailed task description (max 256 chars)
    /// * `reward_lamports` - SOL reward in lamports
    pub fn create_bounty(
        ctx: Context<CreateBounty>,
        title: String,
        description: String,
        reward_lamports: u64,
    ) -> Result<()> {
        instructions::create_bounty::handler(ctx, title, description, reward_lamports)
    }

    /// A developer claims an open bounty.
    pub fn claim_bounty(ctx: Context<ClaimBounty>) -> Result<()> {
        instructions::claim_bounty::handler(ctx)
    }

    /// The AI approves completed work and pays the developer.
    pub fn complete_bounty(ctx: Context<CompleteBounty>) -> Result<()> {
        instructions::complete_bounty::handler(ctx)
    }

    /// The AI withdraws SOL to pay for infrastructure (Akash, etc.)
    ///
    /// # Arguments
    /// * `amount_lamports` - Amount to withdraw in lamports
    pub fn withdraw(ctx: Context<Withdraw>, amount_lamports: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount_lamports)
    }
}
