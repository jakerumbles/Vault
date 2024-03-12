use crate::state::vault_info::*;
use anchor_lang::{prelude::*};
// use anchor_spl::associated_token;
use anchor_spl::{
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
    },
    token::{burn, mint_to, Burn, Mint, MintTo, Token, TokenAccount},
};

use crate::errors::ErrorCode;

#[derive(Accounts)]
#[instruction(
    max_balance: u64,
    params: InitTokenParams
)]
pub struct InitializeVault<'info> {
    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + VaultInfo::LEN,
        seeds = [
            b"vault", deposit_mint.key().as_ref()
        ],
        bump,
        constraint = vault_info.is_initialized == false
    )]
    pub vault_info: Account<'info, VaultInfo>,
    // Mint for the deposit token
    pub deposit_mint: Account<'info, Mint>,
    // If vault is optionally for SPL token deposit, here is its token account
    #[account(
        associated_token::mint = deposit_mint, 
        associated_token::authority = vault_info
    )]
    pub deposit_vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    // Create mint account for LP token
    // Same PDA as address of the account and mint/freeze authority
    #[account(
        init,
        seeds = [b"lp_mint", deposit_mint.key().as_ref()],
        bump,
        payer = payer,
        mint::decimals = params.decimals,
        mint::authority = vault_info,
    )]
    pub lp_mint: Account<'info, Mint>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    /// CHECK: account constraint checked in account trait
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
}

/// Initializes a new vault and sets the vault configuration.
/// `max_balance` is expected to be in lamports.
/// Also creates a new token mint and initializes the metadata for the token
pub fn handler(
    ctx: Context<InitializeVault>,
    max_balance: u64,
    params: InitTokenParams,
) -> Result<()> {
    msg!("Initializing vault...");

    let deposit_mint_key = ctx.accounts.deposit_mint.key();
    let seeds = &[
        "vault".as_bytes(),
        deposit_mint_key.as_ref(),
        &[ctx.bumps.vault_info],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_context = CpiContext::new(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            metadata: ctx.accounts.metadata.to_account_info(),
            mint: ctx.accounts.lp_mint.to_account_info(),
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
        name: params.name,
        symbol: params.symbol.clone(),
        uri: params.uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    create_metadata_accounts_v3(cpi_context, data, true, true, None)?;

    msg!("{} LP token mint created successfully at {}", params.symbol, ctx.accounts.lp_mint.key());

    let vault_info = &mut ctx.accounts.vault_info;
    vault_info.accepted_token_mint = deposit_mint_key;
    vault_info.max_balance = max_balance;
    vault_info.bump = ctx.bumps.vault_info;
    vault_info.is_initialized = true;

    msg!(
        "Vault initialized. Supported token: {} Max balance: {}",
        ctx.accounts.deposit_mint.key(),
        max_balance,
    );

    Ok(())
}
