use anchor_lang::prelude::*;

#[account]
pub struct VaultInfo {
    pub accepted_token_mint: Pubkey, // for USDC mint address for example
    pub max_balance: u64,
    pub bump: u8,
    pub is_initialized: bool,
}

impl VaultInfo {
    pub const LEN: usize = 32 + 8 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitTokenParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}
