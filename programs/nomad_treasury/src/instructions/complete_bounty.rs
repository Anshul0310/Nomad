use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Treasury, Bounty, BountyStatus};
use crate::errors::NomadError;

/// The AI marks a bounty as completed and transfers the reward to the hunter.
/// SOL is transferred from the treasury PDA to the hunter's wallet.
pub fn handler(ctx: Context<CompleteBounty>) -> Result<()> {
    let bounty = &mut ctx.accounts.bounty;

    require!(
        bounty.status == BountyStatus::Claimed,
        NomadError::InvalidBountyStatus
    );

    let hunter_key = bounty
        .hunter
        .ok_or(NomadError::InvalidBountyStatus)?;
    require!(
        hunter_key == ctx.accounts.hunter.key(),
        NomadError::NotAssignedHunter
    );

    let reward = bounty.reward_lamports;
    let treasury = &mut ctx.accounts.treasury;

    // Verify treasury has enough lamports to pay
    let treasury_lamports = treasury.to_account_info().lamports();
    require!(
        treasury_lamports > reward,
        NomadError::InsufficientFunds
    );

    // Transfer SOL from treasury PDA to hunter
    // Using PDA signer seeds for the transfer
    let authority_key = ctx.accounts.authority.key();
    let seeds = &[
        b"treasury",
        authority_key.as_ref(),
        &[treasury.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // Transfer lamports from treasury PDA to hunter
    **treasury.to_account_info().try_borrow_mut_lamports()? -= reward;
    **ctx.accounts.hunter.to_account_info().try_borrow_mut_lamports()? += reward;

    // Update treasury accounting
    treasury.total_spent = treasury
        .total_spent
        .checked_add(reward)
        .ok_or(NomadError::Overflow)?;

    // Mark bounty as completed
    bounty.status = BountyStatus::Completed;

    msg!(
        "✅ Bounty #{} completed! {} lamports sent to {}",
        bounty.bounty_id,
        reward,
        ctx.accounts.hunter.key()
    );

    Ok(())
}

#[derive(Accounts)]
pub struct CompleteBounty<'info> {
    /// The AI's keypair (treasury authority) — must approve completion
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The treasury PDA — source of the reward funds
    #[account(
        mut,
        seeds = [b"treasury", authority.key().as_ref()],
        bump = treasury.bump,
        has_one = authority @ NomadError::Unauthorized,
    )]
    pub treasury: Account<'info, Treasury>,

    /// The bounty being completed
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

    /// The developer who completed the bounty — receives the reward
    /// CHECK: This is validated against bounty.hunter in the handler
    #[account(mut)]
    pub hunter: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
