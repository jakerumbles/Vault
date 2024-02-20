use anchor_lang::{prelude::*, solana_program::program::invoke_signed, system_program};
use anchor_spl::{
    metadata::create_metadata_accounts_v3,
    token::{initialize_mint, mint_to, InitializeMint, Mint, MintTo, Token, TokenAccount},
};

declare_id!("7JCk8GRuxk8KfE6ttP7qx3QdGPDCKKvHyQHuJmHZCAn");

#[program]
pub mod vault {
    use anchor_spl::metadata::{mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3};

    use super::*;

    /// Initializes a new vault and sets the vault configuration.
    /// `max_balance` is expected to be in lamports

    pub fn initialize(
        ctx: Context<Initialize>,
        max_balance: u64,
        metadata: InitTokenParams,
    ) -> Result<()> {
        msg!("Initializing vault...");

        let seeds = &["SOLvault".as_bytes(), &[ctx.bumps.vault_info]];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                // Get the account info for the current program
                mint_authority: ctx.accounts.vault_info.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.vault_info.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        )
        .with_signer(signer_seeds);

        let data: DataV2 = DataV2 {
            name: metadata.name,
            symbol: metadata.symbol.clone(),
            uri: metadata.uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        create_metadata_accounts_v3(cpi_context, data, true, true, None)?;

        msg!("{} token mint created successfully.", metadata.symbol);

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
        msg!(
            "Depositing {} lamports into the vault from {}",
            amount,
            ctx.accounts.depositor.key()
        );

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
// #[instruction(
//     params: InitTokenParams
// )]
pub struct Initialize<'info> {
    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
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
        mint::authority = vault_info,
    )]
    pub mint: Account<'info, Mint>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    /// CHECK: account constraint checked in account trait
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
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
    #[msg("Failed to invoke CreateV1CPI")]
    CreateV1CPIFailure,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct InitTokenParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}
