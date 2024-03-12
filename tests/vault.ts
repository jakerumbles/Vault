import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { BN } from "bn.js";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  ACCOUNT_SIZE,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";

// const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const USDC_DECIMALS = 6;

// Multiply the amount of tokens you want by this to account for decimals
const USDC_DECIMALS_MUL = 1000000;

describe("USDC vault", () => {
  // Configure the client to use the local cluster.
  // anchor.setProvider(anchor.AnchorProvider.env());
  // const provider = anchor.AnchorProvider.env();

  // const program = anchor.workspace.Vault as Program<Vault>;

  // Setup custom USDC mint and vault token account
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  let program: Program<Vault>;
  let utilKeypair: anchor.web3.Keypair;
  let USDC_MINT: PublicKey;
  let vaultInfoPDA: PublicKey;
  let vaultInfoBump: number;
  let depositVaultTokenAccount: PublicKey;
  let depositUserTokenAccount: PublicKey;
  let lpMintPDA: PublicKey;
  const metadata = {
    name: "GEM Vault LP Token",
    symbol: "vGEM",
    uri: "https://raw.githubusercontent.com/jakerumbles/Vault/master/token-metadata/vGEM.json",
    decimals: USDC_DECIMALS,
  };

  before(async () => {
    program = anchor.workspace.Vault as Program<Vault>;
    utilKeypair = anchor.web3.Keypair.generate();

    const signature = await provider.connection.requestAirdrop(
      utilKeypair.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature, "confirmed");

    // get SOL balance of utilKeypair
    let balance = await provider.connection.getBalance(utilKeypair.publicKey);
    console.log(`Balance of utilKeypair: ${balance}`);

    // Create custom USDC mint
    USDC_MINT = await setupUsdc(provider, utilKeypair);

    [vaultInfoPDA, vaultInfoBump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("vault"), USDC_MINT.toBuffer()],
      program.programId
    );

    depositVaultTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      vaultInfoPDA,
      true
    );

    let vaultUsdcAtaExists = await provider.connection.getAccountInfo(
      depositVaultTokenAccount
    );
    if (!vaultUsdcAtaExists) {
      console.log(
        "Creating depositVaultTokenAccount account ",
        depositVaultTokenAccount.toBase58()
      );
      let createAtaIx = createAssociatedTokenAccountInstruction(
        provider.publicKey,
        depositVaultTokenAccount,
        vaultInfoPDA,
        USDC_MINT
      );
      let usdcSetupTx = new anchor.web3.Transaction().add(createAtaIx);

      let signature = await provider.sendAndConfirm(usdcSetupTx);
      // console.log(
      //   `vaultUsdcAta account created: ${vaultUsdcAtaAddress.toBase58()} with signature ${signature}`
      // );
    }

    depositUserTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      provider.publicKey,
      true
    );

    let userUsdcAtaExists = await provider.connection.getAccountInfo(
      depositUserTokenAccount
    );
    if (!userUsdcAtaExists) {
      console.log(
        "Creating depositUserTokenAccount account ",
        depositUserTokenAccount.toBase58()
      );
      let createAtaIx = createAssociatedTokenAccountInstruction(
        provider.publicKey,
        depositUserTokenAccount,
        provider.publicKey,
        USDC_MINT
      );
      let usdcSetupTx = new anchor.web3.Transaction().add(createAtaIx);

      let signature = await provider.sendAndConfirm(usdcSetupTx);
    }

    [lpMintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("lp_mint"), USDC_MINT.toBuffer()],
      program.programId
    );

    // const [tokenAccountPDA, tokenAccountBump] =
    //   PublicKey.findProgramAddressSync(
    //     [anchor.utils.bytes.utf8.encode("SOLmint")],
    //     program.programId
    //   );
  });

  it("Is initialized!", async () => {
    // Derive the metadata account address.
    const [metadataAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        lpMintPDA.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const maxBalance = new BN(100000 * USDC_DECIMALS_MUL);

    let signature = await program.methods
      .initializeVault(maxBalance, metadata)
      .accounts({
        metadata: metadataAddress,
        vaultInfo: vaultInfoPDA,
        depositMint: USDC_MINT,
        depositVaultTokenAccount: depositVaultTokenAccount,
        payer: provider.publicKey,
        lpMint: lpMintPDA,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .rpc();

    // provider.opts.skipPreflight = true;
    // let tx = await // .signers([mint])
    // program.methods
    //   .initialize(maxBalance, metadata)
    //   .accounts({
    //     metadata: metadataAddress,
    //     vaultInfo: vaultInfoPDA,
    //     payer: provider.publicKey,
    //     mint: mintPDA,
    //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //     tokenProgram: tokenProgram,
    //     tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    //   })
    //   .transaction();

    // let blockhash = (await provider.connection.getLatestBlockhash("finalized"))
    //   .blockhash;
    // tx.recentBlockhash = blockhash;
    // tx.feePayer = provider.wallet.publicKey;
    // provider.wallet.signTransaction(tx);

    // const signature = await provider.connection.sendRawTransaction(
    //   tx.serialize(),
    //   {
    //     skipPreflight: true,
    //   }
    // );

    console.log(
      `View transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );
  });

  it("Deposits 500 USDC twice", async () => {
    // Get the starting USDC balance of the vault_info account before deposit
    const beforeDepositBalance = (
      await provider.connection.getTokenAccountBalance(depositVaultTokenAccount)
    ).value.uiAmount;
    console.log(`Before deposit balance: ${beforeDepositBalance}`);

    // Get the ATA address for the vaults LP token (but it might not existing on the SOL network yet)
    const userLpTokenAccount = await getAssociatedTokenAddress(
      lpMintPDA,
      provider.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const createATA = new anchor.web3.Transaction().add(
      // Create the ATA account that is associated with our mint on our anchor wallet
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        userLpTokenAccount,
        provider.publicKey,
        lpMintPDA
      )
    );

    const res = await provider.sendAndConfirm(createATA);
    console.log(
      `CREATEATA transaction: https://explorer.solana.com/tx/${res}?cluster=custom`
    );

    // Verify 0 balance for new vGEM ATA
    const balance = await provider.connection.getTokenAccountBalance(
      userLpTokenAccount
    );
    assert(Number(balance.value.amount) === 0);

    const depositAmount = new BN(500 * USDC_DECIMALS_MUL);

    const signature = await program.methods
      .deposit(depositAmount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        depositMint: USDC_MINT,
        depositVaultTokenAccount: depositVaultTokenAccount,
        depositUserTokenAccount: depositUserTokenAccount,
        lpMint: lpMintPDA,
        userLpTokenAccount: userLpTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // const tx = await program.methods
    //   .deposit(depositAmount)
    //   .accounts({
    //     vaultInfo: vaultInfoPDA,
    //     depositMint: USDC_MINT,
    //     depositVaultTokenAccount: depositVaultTokenAccount,
    //     depositUserTokenAccount: depositUserTokenAccount,
    //     lpMint: lpMintPDA,
    //     userLpTokenAccount: userLpTokenAccount,
    //     payer: provider.publicKey,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //   })
    //   .transaction();

    // let blockhash = (await provider.connection.getLatestBlockhash("finalized"))
    //   .blockhash;
    // tx.recentBlockhash = blockhash;
    // tx.feePayer = provider.publicKey;
    // provider.wallet.signTransaction(tx);

    // const signature = await provider.connection.sendRawTransaction(
    //   tx.serialize(),
    //   {
    //     skipPreflight: true,
    //   }
    // );

    console.log(
      `DEPOSIT_SOL transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );

    // Verify the vault_info account holds the correct amount of USDC after the deposit
    const afterDepositBalUsdc = (
      await provider.connection.getTokenAccountBalance(depositVaultTokenAccount)
    ).value.amount;

    console.log(
      `VAULT After deposit balance for ${vaultInfoPDA.toBase58()}: ${afterDepositBalUsdc} USDC`
    );

    assert(
      Number(afterDepositBalUsdc) ===
        beforeDepositBalance + Number(depositAmount)
    );

    // Verify updated balance for vGEM ATA
    const afterBalanceATA = await provider.connection.getTokenAccountBalance(
      userLpTokenAccount
    );
    assert(Number(afterBalanceATA.value.amount) === Number(depositAmount));

    // Deposit a 2nd time
    const signature2 = await program.methods
      .deposit(depositAmount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        depositMint: USDC_MINT,
        depositVaultTokenAccount: depositVaultTokenAccount,
        depositUserTokenAccount: depositUserTokenAccount,
        lpMint: lpMintPDA,
        userLpTokenAccount: userLpTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log(
      `#2 DEPOSIT_SOL transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );

    // Verify the Vault USDC account holds the correct amount of USDC after the deposit
    const finalDepositBalUSDC = (
      await provider.connection.getTokenAccountBalance(depositVaultTokenAccount)
    ).value.amount;

    assert(
      Number(finalDepositBalUSDC) ===
        Number(afterDepositBalUsdc) + Number(depositAmount)
    );

    // Verify final balance for vGEM ATA
    const finalBalanceATA = await provider.connection.getTokenAccountBalance(
      userLpTokenAccount
    );
    assert(
      Number(finalBalanceATA.value.amount) ===
        Number(afterBalanceATA.value.amount) + Number(depositAmount)
    );
  });

  it("Withdraws 500 USDC twice", async () => {
    const userLpTokenAccount = await getAssociatedTokenAddress(
      lpMintPDA,
      provider.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Get the starting USDC balance of the vault_info account before deposit
    const vaultBeforeWithdrawBalUSDC = Number(
      (
        await provider.connection.getTokenAccountBalance(
          depositVaultTokenAccount
        )
      ).value.amount
    );

    const userBeforeWithdrawBalUSDC = Number(
      (
        await provider.connection.getTokenAccountBalance(
          depositUserTokenAccount
        )
      ).value.amount
    );

    // Verify initial balance for LP ATA
    const userBeforeWithdrawBalLP = Number(
      (await provider.connection.getTokenAccountBalance(userLpTokenAccount))
        .value.amount
    );

    console.log(
      `\n----------------
  BEFORE withdraw balances
  VAULT USDC: ${vaultBeforeWithdrawBalUSDC / USDC_DECIMALS_MUL}
  USER USDC: ${userBeforeWithdrawBalUSDC / USDC_DECIMALS_MUL}
  USER LP: ${userBeforeWithdrawBalLP / USDC_DECIMALS_MUL}`
    );

    const withdrawAmount = new BN(500 * USDC_DECIMALS_MUL);

    const signature = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        depositMint: USDC_MINT,
        depositVaultTokenAccount: depositVaultTokenAccount,
        depositUserTokenAccount: depositUserTokenAccount,
        lpMint: lpMintPDA,
        userLpTokenAccount: userLpTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // const tx = await program.methods
    //   .withdraw(withdrawAmount)
    //   .accounts({
    //     vaultInfo: vaultInfoPDA,
    //     depositMint: USDC_MINT,
    //     depositVaultTokenAccount: depositVaultTokenAccount,
    //     depositUserTokenAccount: depositUserTokenAccount,
    //     lpMint: lpMintPDA,
    //     userLpTokenAccount: userLpTokenAccount,
    //     payer: provider.publicKey,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //   })
    //   .transaction();

    // let blockhash = (await provider.connection.getLatestBlockhash("finalized"))
    //   .blockhash;
    // tx.recentBlockhash = blockhash;
    // tx.feePayer = provider.wallet.publicKey;
    // provider.wallet.signTransaction(tx);

    // const signature = await provider.connection.sendRawTransaction(
    //   tx.serialize(),
    //   {
    //     skipPreflight: true,
    //   }
    // );

    console.log(
      `WITHDRAW_SOL transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );

    // Verify the vault_info account holds the correct amount of SOL after the deposit
    const vaultAfterWithdrawBalUSDC = Number(
      (
        await provider.connection.getTokenAccountBalance(
          depositVaultTokenAccount
        )
      ).value.amount
    );

    const userAfterWithdrawBalUSDC = Number(
      (
        await provider.connection.getTokenAccountBalance(
          depositUserTokenAccount
        )
      ).value.amount
    );

    let userAfterWithdrawBalLP = Number(
      (await provider.connection.getTokenAccountBalance(userLpTokenAccount))
        .value.amount
    );

    console.log(
      `\n----------------
    AFTER 1st withdraw balances
    VAULT USDC: ${vaultAfterWithdrawBalUSDC / USDC_DECIMALS_MUL}
    USER USDC: ${userAfterWithdrawBalUSDC / USDC_DECIMALS_MUL}
    USER LP: ${userAfterWithdrawBalLP / USDC_DECIMALS_MUL}`
    );

    // USDC was returned to the user
    assert(
      vaultAfterWithdrawBalUSDC ===
        vaultBeforeWithdrawBalUSDC - Number(withdrawAmount)
    );

    assert(
      userAfterWithdrawBalUSDC ===
        userBeforeWithdrawBalUSDC + Number(withdrawAmount)
    );

    // Verify updated balance for LP ATA
    assert(
      userAfterWithdrawBalLP ===
        userBeforeWithdrawBalLP - Number(withdrawAmount)
    );

    // Withdraw the rest
    const signature2 = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        depositMint: USDC_MINT,
        depositVaultTokenAccount: depositVaultTokenAccount,
        depositUserTokenAccount: depositUserTokenAccount,
        lpMint: lpMintPDA,
        userLpTokenAccount: userLpTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log(
      `2nd WITHDRAW_SOL transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );

    // Verify the vault_info account holds the correct amount of SOL after the deposit
    const vaultFinalWithdrawBalUSDC = Number(
      (
        await provider.connection.getTokenAccountBalance(
          depositVaultTokenAccount
        )
      ).value.amount
    );

    const userFinalWithdrawBalUSDC = Number(
      (
        await provider.connection.getTokenAccountBalance(
          depositUserTokenAccount
        )
      ).value.amount
    );

    let userFinalWithdrawBalLP = Number(
      (await provider.connection.getTokenAccountBalance(userLpTokenAccount))
        .value.amount
    );

    console.log(
      `\n----------------
    AFTER 2nd withdraw balances
    VAULT USDC: ${vaultFinalWithdrawBalUSDC / USDC_DECIMALS_MUL}
    USER USDC: ${userFinalWithdrawBalUSDC / USDC_DECIMALS_MUL}
    USER LP: ${userFinalWithdrawBalLP / USDC_DECIMALS_MUL}`
    );

    // USDC was returned to the user
    assert(
      vaultFinalWithdrawBalUSDC ===
        vaultAfterWithdrawBalUSDC - Number(withdrawAmount)
    );

    assert(
      userFinalWithdrawBalUSDC ===
        userAfterWithdrawBalUSDC + Number(withdrawAmount)
    );

    // Verify updated balance for LP ATA
    assert(
      userFinalWithdrawBalLP === userAfterWithdrawBalLP - Number(withdrawAmount)
    );
  });
});

/** Setup a custom USDC mint and token account */
async function setupUsdc(
  provider: anchor.Provider,
  utilKeypair: anchor.web3.Keypair
): Promise<PublicKey> {
  // create a new mint
  const USDC_MINT = await createMint(
    provider.connection,
    utilKeypair,
    utilKeypair.publicKey,
    utilKeypair.publicKey,
    USDC_DECIMALS
  );
  console.log(`USDC_MINT: ${USDC_MINT.toBase58()}`);

  // create a new token account
  const userUsdcTokenAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    utilKeypair,
    USDC_MINT,
    provider.publicKey
  );
  // mint tokens to the token account
  await mintTo(
    provider.connection,
    utilKeypair,
    USDC_MINT,
    userUsdcTokenAccount.address,
    utilKeypair,
    10000 * USDC_DECIMALS_MUL
  );

  // Mint some to my wallet for localnet frontend testing
  const frontentTestingUsdcTokenAccount =
    await getOrCreateAssociatedTokenAccount(
      provider.connection,
      utilKeypair,
      USDC_MINT,
      new PublicKey("E2BP8h6dYDKyx4Thw2LHF2MJt6YyqPwHDUBEepfHC4de")
    );

  await mintTo(
    provider.connection,
    utilKeypair,
    USDC_MINT,
    frontentTestingUsdcTokenAccount.address,
    utilKeypair,
    10000 * USDC_DECIMALS_MUL
  );

  // return the token account
  return USDC_MINT;
}
