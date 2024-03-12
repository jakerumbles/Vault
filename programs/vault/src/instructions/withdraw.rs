use crate::errors::ErrorCode;
use crate::state::vault_info::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{burn, transfer, Burn, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault", deposit_mint.key().as_ref()],
        bump,
        constraint = vault_info.is_initialized == true
    )]
    pub vault_info: Account<'info, VaultInfo>,
    // Mint for the deposited token e.g. USDC
    pub deposit_mint: Account<'info, Mint>,
    // Vaults account for the deposited token
    #[account(
            mut,
            associated_token::mint = deposit_mint,
            associated_token::authority = vault_info
        )]
    pub deposit_vault_token_account: Account<'info, TokenAccount>,
    // Users account for the deposited token
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
    pub lp_mint: Account<'info, Mint>,
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

/// Burns LP tokens from the depositor and transfers the originally deposited tokens back to the depositor.
pub fn handler(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // Verify non-zero LP token balance
    let caller_balance = ctx.accounts.user_lp_token_account.amount;
    if caller_balance == 0 {
        return Err(ErrorCode::NoBalance.into());
    }

    // Verify LP token balance is greater than or equal to the withdrawal amount
    if caller_balance < amount {
        return Err(ErrorCode::WithdrawAmountTooLarge.into());
    }

    // Burn LP tokens. Vault owns the LP mint so it must sign off on the burn
    let deposit_mint_key = ctx.accounts.deposit_mint.key();
    let seeds = &[
        "vault".as_bytes(),
        deposit_mint_key.as_ref(),
        &[ctx.bumps.vault_info],
    ];
    let signer_seeds = &[&seeds[..]];
    let burn_cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.lp_mint.to_account_info(),
            from: ctx.accounts.user_lp_token_account.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        },
        signer_seeds,
    );

    burn(burn_cpi_context, amount)?;

    msg!(
        "Burned {} LP tokens from {} for {}",
        amount,
        ctx.accounts.user_lp_token_account.key(),
        ctx.accounts.payer.key()
    );

    // Transfer the deposited tokens back to the depositor
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.deposit_vault_token_account.to_account_info(),
            to: ctx.accounts.deposit_user_token_account.to_account_info(),
            authority: ctx.accounts.vault_info.to_account_info(),
        },
        signer_seeds,
    );
    transfer(transfer_ctx, amount)?;

    msg!(
        "Transferred {} tokens back to {} for {}",
        amount,
        ctx.accounts.deposit_user_token_account.key(),
        ctx.accounts.payer.key()
    );

    Ok(())
}
