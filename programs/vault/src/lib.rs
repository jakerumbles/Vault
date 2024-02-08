use anchor_lang::prelude::*;

declare_id!("7JCk8GRuxk8KfE6ttP7qx3QdGPDCKKvHyQHuJmHZCAn");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
