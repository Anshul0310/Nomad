use anchor_lang::prelude::*;

#[error_code]
pub enum NomadError {
    #[msg("Insufficient funds in treasury to perform this action")]
    InsufficientFunds,

    #[msg("Treasury balance is below the bounty creation threshold")]
    BelowBountyThreshold,

    #[msg("Bounty is not in the required status for this operation")]
    InvalidBountyStatus,

    #[msg("Only the treasury authority can perform this action")]
    Unauthorized,

    #[msg("Bounty title exceeds maximum length of 64 characters")]
    TitleTooLong,

    #[msg("Bounty description exceeds maximum length of 256 characters")]
    DescriptionTooLong,

    #[msg("Reward amount must be greater than zero")]
    ZeroReward,

    #[msg("Withdrawal amount exceeds treasury balance")]
    WithdrawalExceedsBalance,

    #[msg("Only the assigned hunter can perform this action")]
    NotAssignedHunter,

    #[msg("Arithmetic overflow occurred")]
    Overflow,
}
