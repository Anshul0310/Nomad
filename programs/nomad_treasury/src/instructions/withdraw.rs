use anchor_lang::prelude::*;
use crate::state::Treasury;
use crate::errors::NomadError;

/// The AI withdraws SOL from its treasury to pay for infrastructure (Akash rent, etc.)
/// Only the treasury authority (the AI) can call this.
pub fn handler(ctx: Context<Withdraw>, amount_lamports: u64) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;

    let treasury_lamports = treasury.to_account_info().lamports();
    require!(
        treasury_lamports > amount_lamports,
        NomadError::WithdrawalExceedsBalance
    );

    // Transfer lamports from treasury PDA to the destination
    **treasury.to_account_info().try_borrow_mut_lamports()? -= amount_lamports;
    **ctx.accounts.destination.to_account_info().try_borrow_mut_lamports()? += amount_lamports;

    // Update accounting
    treasury.total_spent = treasury
        .total_spent
        .checked_add(amount_lamports)
        .ok_or(NomadError::Overflow)?;

    msg!(
        "💸 Withdrew {} lamports to {} for infrastructure costs",
        amount_lamports,
        ctx.accounts.destination.key()
    );

    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// The AI's keypair (treasury authority)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The treasury PDA
    #[account(
        mut,
        seeds = [b"treasury", authority.key().as_ref()],
        bump = treasury.bump,
        has_one = authority @ NomadError::Unauthorized,
    )]
    pub treasury: Account<'info, Treasury>,

    /// The destination account (e.g., Akash payment address)
    /// CHECK: Any valid account can receive SOL
    #[account(mut)]
    pub destination: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
