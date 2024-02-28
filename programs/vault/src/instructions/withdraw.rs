use crate::errors::ErrorCode;
use crate::state::vault_info::*;
use crate::util::transfer_lamports;
use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
    },
    token::{burn, mint_to, Burn, Mint, MintTo, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
        constraint = vault_info.is_initialized == true
    )]
    pub vault_info: Account<'info, VaultInfo>,
    #[account(
        mut,
        seeds = [b"mint"],
        bump,
        mint::authority = vault_info,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub burn_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

/// Withdraws LP tokens from the depositor and burns them, transferring SOL to the depositor.
pub fn handler(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // Verify non-zero LP token balance
    let caller_balance = ctx.accounts.burn_ata.amount;
    if caller_balance == 0 {
        return Err(ErrorCode::NoBalance.into());
    }

    // Verify LP token balance is greater than or equal to the withdrawal amount
    if caller_balance < amount {
        return Err(ErrorCode::WithdrawAmountTooLarge.into());
    }

    // Burn LP tokens. Vault owns the LP mint so it must sign off on the burn
    let seeds = &["vault".as_bytes(), &[ctx.bumps.vault_info]];
    let signer_seeds = &[&seeds[..]];
    let burn_cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.burn_ata.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        },
        signer_seeds,
    );

    burn(burn_cpi_context, amount)?;

    msg!(
        "Burned {} LP tokens from {} for {}",
        amount,
        ctx.accounts.burn_ata.key(),
        ctx.accounts.payer.key()
    );

    // Transfer the SOL back to the depositor
    // Using custom transfer fn here b/c the `vault_info` account is owned by the vault program, not the System Program
    transfer_lamports(
        &ctx.accounts.vault_info.to_account_info(),
        &ctx.accounts.payer.to_account_info(),
        amount,
    )?;

    // let cpi_context = CpiContext::new_with_signer(
    //     ctx.accounts.system_program.to_account_info(),
    //     system_program::Transfer {
    //         from: ctx.accounts.vault_info.to_account_info(),
    //         to: ctx.accounts.payer.to_account_info(),
    //     },
    //     signer_seeds,
    // );
    // system_program::transfer(cpi_context, amount)?;

    msg!(
        "Transferred {} lamports back to {}",
        amount,
        ctx.accounts.payer.key()
    );

    Ok(())
}
