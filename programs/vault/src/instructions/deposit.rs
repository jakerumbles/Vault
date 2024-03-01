use crate::errors::ErrorCode;
use crate::state::vault_info::*;
use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
    },
    token::{burn, mint_to, Burn, Mint, MintTo, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
        constraint = vault_info.is_initialized == true
    )]
    pub vault_info: Account<'info, VaultInfo>,
    // Mint for the deposit token
    pub deposit_mint: Account<'info, Mint>,
    // If vault is optionally for SPL token deposit, here is its token account
    pub deposit_vault_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"mint"],
        bump,
        mint::authority = vault_info,
    )]
    pub lp_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = lp_mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

/// Deposits SOL into the vault and mints LP tokens to the depositor.
/// TODO: Make sure decimals are handled with `amount`
pub fn handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let vault_info = &ctx.accounts.vault_info;
    let new_balance = vault_info.get_lamports() + amount;
    if new_balance > vault_info.max_balance {
        return Err(ErrorCode::DepositAmountTooLarge.into());
    }

    // Transfer the SOL from the depositor to the vault
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.vault_info.to_account_info(),
        },
    );
    system_program::transfer(cpi_context, amount)?;

    msg!(
        "Deposited {} lamports into the vault from {}",
        amount,
        ctx.accounts.payer.key()
    );

    // Mint LP tokens to the depositor
    let seeds = &["vault".as_bytes(), &[ctx.bumps.vault_info]];
    let signer_seeds = &[&seeds[..]];
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.lp_mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.vault_info.to_account_info(),
        },
        signer_seeds,
    );

    mint_to(cpi_context, amount)?;

    msg!(
        "Minted {} LP tokens to {} for {}",
        amount,
        ctx.accounts.destination.key(),
        ctx.accounts.payer.key()
    );

    Ok(())
}
