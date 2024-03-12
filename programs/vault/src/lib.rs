pub mod errors;
pub mod instructions;
pub mod state;
mod util;

use anchor_lang::prelude::*;
use instructions::*;
use state::InitTokenParams;

declare_id!("FqW6Qr48BzG7uNZ9p16jUFtuDdDwQM2zwWCXq2gYokki");

#[program]
pub mod vault {
    use super::*;

    /// Initializes a new vault and sets the vault configuration.
    /// `max_balance` is expected to be in lamports.
    /// Also creates a new token mint and initializes the metadata for the token
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        max_balance: u64,
        metadata: InitTokenParams,
    ) -> Result<()> {
        instructions::initialize_vault::handler(ctx, max_balance, metadata)
    }

    /// Deposits SOL into the vault and mints LP tokens to the depositor.
    /// TODO: Make sure decimals are handled with `amount`
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    /// Withdraws LP tokens from the depositor and burns them, transferring SOL to the depositor.
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }
}
