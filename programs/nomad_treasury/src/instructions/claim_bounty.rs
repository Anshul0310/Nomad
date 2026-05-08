use anchor_lang::prelude::*;
use crate::state::{Bounty, BountyStatus, Treasury};
use crate::errors::NomadError;

/// A human developer claims an open bounty.
/// This marks the bounty as "Claimed" and records the hunter's pubkey.
pub fn handler(ctx: Context<ClaimBounty>) -> Result<()> {
    let bounty = &mut ctx.accounts.bounty;

    require!(
        bounty.status == BountyStatus::Open,
        NomadError::InvalidBountyStatus
    );

    bounty.status = BountyStatus::Claimed;
    bounty.hunter = Some(ctx.accounts.hunter.key());

    msg!(
        "🏹 Bounty #{} claimed by {}",
        bounty.bounty_id,
        ctx.accounts.hunter.key()
    );

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimBounty<'info> {
    /// The developer claiming this bounty
    #[account(mut)]
    pub hunter: Signer<'info>,

    /// The treasury that owns this bounty (for seed derivation)
    #[account(
        seeds = [b"treasury", treasury.authority.as_ref()],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    /// The bounty being claimed
    #[account(
        mut,
        seeds = [
            b"bounty",
            treasury.key().as_ref(),
            bounty.bounty_id.to_le_bytes().as_ref()
        ],
        bump = bounty.bump,
        has_one = treasury,
    )]
    pub bounty: Account<'info, Bounty>,
}
