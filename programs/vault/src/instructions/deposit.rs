use crate::errors::ErrorCode;
use crate::state::vault_info::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{mint_to, transfer, Mint, MintTo, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault", deposit_mint.key().as_ref()],
        bump,
        constraint = vault_info.is_initialized == true
    )]
    pub vault_info: Account<'info, VaultInfo>,
    // Mint for the deposit token
    pub deposit_mint: Account<'info, Mint>,
    // Deposit token account for the vault
    #[account(
        mut,
        associated_token::mint = deposit_mint,
        associated_token::authority = vault_info
    )]
    pub deposit_vault_token_account: Account<'info, TokenAccount>,
    // Deposit token account for the user
    #[account(
        mut,
        associated_token::mint = deposit_mint,
        associated_token::authority = payer
    )]
    pub deposit_user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"lp_mint", deposit_mint.key().as_ref()],
        bump,
        mint::authority = vault_info,
    )]
    // Account for the LP token mint
    pub lp_mint: Account<'info, Mint>,
    // User's LP token account
    #[account(
        mut,
        associated_token::mint = lp_mint,
        associated_token::authority = payer,
    )]
    pub user_lp_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

/// Deposits SPL tokens into the vault and mints LP tokens to the depositor.
/// `amount` is expected to be in the native token's base unit.
pub fn handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let vault_info = &ctx.accounts.vault_info;

    // Checks
    let new_balance = match ctx
        .accounts
        .deposit_vault_token_account
        .amount
        .checked_add(amount)
    {
        Some(new_balance) => new_balance,
        None => return Err(ErrorCode::DepositAmountTooLarge.into()),
    };

    if new_balance > vault_info.max_balance {
        return Err(ErrorCode::DepositAmountTooLarge.into());
    }

    // Transfer the SPL token, accepted by the vault, from the depositor to the vault's ATA
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.deposit_user_token_account.to_account_info(),
            to: ctx.accounts.deposit_vault_token_account.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        },
    );
    transfer(transfer_ctx, amount)?;

    msg!(
        "Deposited {} tokens into the vault from {}",
        amount,
        ctx.accounts.payer.key()
    );

    // Mint LP tokens to the depositor
    let deposit_mint_key = ctx.accounts.deposit_mint.key();
    let seeds = &[
        "vault".as_bytes(),
        deposit_mint_key.as_ref(),
        &[ctx.bumps.vault_info],
    ];
    let signer_seeds = &[&seeds[..]];
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.lp_mint.to_account_info(),
            to: ctx.accounts.user_lp_token_account.to_account_info(),
            authority: ctx.accounts.vault_info.to_account_info(),
        },
        signer_seeds,
    );

    mint_to(cpi_context, amount)?;

    msg!(
        "Minted {} LP tokens to {} for {}",
        amount,
        ctx.accounts.user_lp_token_account.key(),
        ctx.accounts.payer.key()
    );

    Ok(())
}
