use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    // associated_token::AssociatedToken,
    metadata::mpl_token_metadata::{
        accounts::Metadata,
        instructions::CreateV1CpiBuilder,
        types::{PrintSupply, TokenStandard},
    },
    token::{initialize_mint, mint_to, InitializeMint, Mint, MintTo, Token, TokenAccount},
};

declare_id!("7JCk8GRuxk8KfE6ttP7qx3QdGPDCKKvHyQHuJmHZCAn");

#[program]
pub mod vault {
    use super::*;

    /// Initializes a new vault and sets the vault configuration.
    /// `max_balance` is expected to be in lamports
    pub fn initialize(ctx: Context<Initialize>, max_balance: u64, decimals: u8) -> Result<()> {
        let create_cpi = CreateV1CpiBuilder::new(&ctx.accounts.metadata_account.to_account_info());
        create_cpi.invoke()?;

        let vault_info = &mut ctx.accounts.vault_info;
        vault_info.max_balance = max_balance;
        vault_info.bump = ctx.bumps.vault_info;
        vault_info.is_initialized = true;

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
        payer = payer,
        space = 8 + VaultInfo::LEN,
        seeds = [b"SOLvault"],
        bump,
        constraint = vault_info.is_initialized == false
    )]
    pub vault_info: Account<'info, VaultInfo>,
    #[account(mut)]
    pub payer: Signer<'info>,
    // Create mint account
    // Same PDA as address of the account and mint/freeze authority
    #[account(
        init,
        seeds = [b"mint"],
        bump,
        payer = payer,
        mint::decimals = 9,
        mint::authority = mint_account.key(),
        mint::freeze_authority = mint_account.key(),

    )]
    pub mint_account: Account<'info, Mint>,
    /// CHECK: Address validated using constraint
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        constraint = vault_info.is_initialized == true
    )]
    pub vault_info: Account<'info, VaultInfo>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct VaultInfo {
    // pub accepted_token: Pubkey, for USDC mint address for example
    pub max_balance: u64,
    pub bump: u8,
    pub is_initialized: bool,
}

impl VaultInfo {
    pub const LEN: usize = 8 + 1 + 1;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Deposit amount too large. Would cause vault to exceed max balance.")]
    DepositAmountTooLarge,
}
