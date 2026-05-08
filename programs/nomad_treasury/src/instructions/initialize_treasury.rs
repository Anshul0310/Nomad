use anchor_lang::prelude::*;
use crate::state::Treasury;

/// Initialize the AI's treasury PDA.
/// Called once when the Nomad AI is first deployed.
pub fn handler(
    ctx: Context<InitializeTreasury>,
    balance_threshold: u64,
    daily_rent_lamports: u64,
) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    treasury.authority = ctx.accounts.authority.key();
    treasury.balance_threshold = balance_threshold;
    treasury.total_earned = 0;
    treasury.total_spent = 0;
    treasury.bounty_count = 0;
    treasury.daily_rent_lamports = daily_rent_lamports;
    treasury.bump = ctx.bumps.treasury;

    msg!(
        "🏛️ Nomad Treasury initialized. Authority: {}. Threshold: {} lamports.",
        treasury.authority,
        treasury.balance_threshold
    );

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    /// The AI's keypair that will control this treasury
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The treasury PDA — derived from the authority's public key
    #[account(
        init,
        payer = authority,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [b"treasury", authority.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    pub system_program: Program<'info, System>,
}
