use anchor_lang::{prelude::*, system_program};

declare_id!("7JCk8GRuxk8KfE6ttP7qx3QdGPDCKKvHyQHuJmHZCAn");

#[program]
pub mod vault {
    use super::*;

    /// Initializes a new vault and sets the vault configuration.
    /// `max_balance` is expected to be in lamports
    pub fn initialize(ctx: Context<Initialize>, max_balance: u64) -> Result<()> {
        let vault_info = &mut ctx.accounts.vault_info;
        vault_info.max_balance = max_balance;
        vault_info.bump = ctx.bumps.vault_info;
        msg!(
            "Vault initialized. Max balance: {} SOL, bump: {}",
            max_balance,
            vault_info.bump
        );
        Ok(())
    }

    /// Deposits SOL into the vault
    pub fn deposit_sol(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let vault_info = &ctx.accounts.vault_info;
        let new_balance = vault_info.get_lamports() + amount;
        if new_balance > vault_info.max_balance {
            return Err(ErrorCode::DepositAmountTooLarge.into());
        }
        msg!("Depositing {} lamports into the vault...", amount);

        // Transfer the SOL from the depositor to the vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to: ctx.accounts.vault_info.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = provider,
        space = 8 + VaultInfo::LEN,
        seeds = [b"SOLvault"],
        bump
    )]
    pub vault_info: Account<'info, VaultInfo>,
    #[account(mut)]
    pub provider: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault_info: Account<'info, VaultInfo>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct VaultInfo {
    // pub accepted_token: Pubkey,
    pub max_balance: u64,
    pub bump: u8,
}

impl VaultInfo {
    pub const LEN: usize = 8 + 1;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Deposit amount too large. Would cause vault to exceed max balance.")]
    DepositAmountTooLarge,
}
