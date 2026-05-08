use anchor_lang::prelude::*;
use crate::state::{Treasury, Bounty, BountyStatus};
use crate::errors::NomadError;

/// The AI creates a bounty to hire a human developer.
/// Only callable when treasury balance exceeds the threshold.
pub fn handler(
    ctx: Context<CreateBounty>,
    title: String,
    description: String,
    reward_lamports: u64,
) -> Result<()> {
    require!(title.len() <= 64, NomadError::TitleTooLong);
    require!(description.len() <= 256, NomadError::DescriptionTooLong);
    require!(reward_lamports > 0, NomadError::ZeroReward);

    let treasury = &mut ctx.accounts.treasury;

    // Check that the treasury has enough balance above the threshold
    let treasury_balance = treasury.to_account_info().lamports();
    require!(
        treasury_balance >= treasury.balance_threshold,
        NomadError::BelowBountyThreshold
    );
    require!(
        treasury_balance >= reward_lamports,
        NomadError::InsufficientFunds
    );

    // Set up the bounty
    let bounty = &mut ctx.accounts.bounty;
    bounty.treasury = treasury.key();
    bounty.bounty_id = treasury.bounty_count;
    bounty.title = title.clone();
    bounty.description = description;
    bounty.reward_lamports = reward_lamports;
    bounty.status = BountyStatus::Open;
    bounty.hunter = None;
    bounty.created_at = Clock::get()?.unix_timestamp;
    bounty.bump = ctx.bumps.bounty;

    // Increment the bounty counter
    treasury.bounty_count = treasury
        .bounty_count
        .checked_add(1)
        .ok_or(NomadError::Overflow)?;

    msg!(
        "🎯 Bounty #{} created: '{}' — Reward: {} lamports",
        bounty.bounty_id,
        title,
        reward_lamports
    );

    Ok(())
}

#[derive(Accounts)]
pub struct CreateBounty<'info> {
    /// The AI's keypair (treasury authority)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The treasury PDA — must be owned by the authority
    #[account(
        mut,
        seeds = [b"treasury", authority.key().as_ref()],
        bump = treasury.bump,
        has_one = authority @ NomadError::Unauthorized,
    )]
    pub treasury: Account<'info, Treasury>,

    /// The new bounty PDA — derived from treasury + bounty_count
    #[account(
        init,
        payer = authority,
        space = 8 + Bounty::INIT_SPACE,
        seeds = [
            b"bounty",
            treasury.key().as_ref(),
            treasury.bounty_count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub bounty: Account<'info, Bounty>,

    pub system_program: Program<'info, System>,
}
