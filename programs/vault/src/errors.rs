use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Deposit amount too large. Would cause vault to exceed max balance.")]
    DepositAmountTooLarge,
    #[msg("No LP tokens to burn for withdrawal.")]
    NoBalance,
    #[msg("Withdraw amount is greater than callers LP token balance.")]
    WithdrawAmountTooLarge,
    #[msg("Insufficient SOL for transaction.")]
    InsufficientSOLForTransfer,
}
