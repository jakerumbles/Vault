import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { BN } from "bn.js";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  ACCOUNT_SIZE,
} from "@solana/spl-token";
import { assert } from "chai";

describe("vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const program = anchor.workspace.Vault as Program<Vault>;

  const [vaultInfoPDA, vaultInfoBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("vault")],
    program.programId
  );

  const [mintPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  );

  const metadata = {
    name: "GEM Vault LP Token",
    symbol: "vGEM",
    uri: "https://raw.githubusercontent.com/jakerumbles/Vault/master/token-metadata/vGEM.json",
    decimals: 9,
  };

  // const tokenProgram = new PublicKey(
  //   // "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  //   TOKEN_PROGRAM_ID
  // );

  const [tokenAccountPDA, tokenAccountBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("SOLmint")],
    program.programId
  );

  it("Is initialized!", async () => {
    // Derive the metadata account address.
    const [metadataAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPDA.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const maxBalance = new BN(100000 * LAMPORTS_PER_SOL);

    let signature = await program.methods
      .initializeVault(maxBalance, metadata)
      .accounts({
        metadata: metadataAddress,
        vaultInfo: vaultInfoPDA,
        payer: provider.publicKey,
        mint: mintPDA,
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

  it("Deposits 1.5 SOL twice", async () => {
    // Get the starting SOL balance of the vault_info account before deposit
    const beforeDepositBalance = await provider.connection.getBalance(
      vaultInfoPDA
    );
    console.log(
      `Before deposit balance: ${beforeDepositBalance / LAMPORTS_PER_SOL}`
    );

    // Get the ATA for a token and the account that we want to own the ATA (but it might not existing on the SOL network yet)
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintPDA,
      provider.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const createATA = new anchor.web3.Transaction().add(
      // Create the ATA account that is associated with our mint on our anchor wallet
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        associatedTokenAccount,
        provider.publicKey,
        mintPDA
      )
    );

    const res = await provider.sendAndConfirm(createATA);
    console.log(
      `CREATEATA transaction: https://explorer.solana.com/tx/${res}?cluster=custom`
    );

    // Verify 0 balance for new vGEM ATA
    const balance = await provider.connection.getTokenAccountBalance(
      associatedTokenAccount
    );
    assert(Number(balance.value.amount) === 0);

    const depositAmount = new BN(1.5 * LAMPORTS_PER_SOL);

    const signature = await program.methods
      .deposit(depositAmount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        mint: mintPDA,
        destination: associatedTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // const tx = await program.methods
    //   .depositSol(amount)
    //   .accounts({
    //     vaultInfo: vaultInfoPDA,
    //     mint: mintPDA,
    //     destination: associatedTokenAccount,
    //     payer: provider.publicKey,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
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
      `DEPOSIT_SOL transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );

    // Verify the vault_info account holds the correct amount of SOL after the deposit
    const afterDepositBalSOL = await provider.connection.getBalance(
      vaultInfoPDA
    );

    console.log(
      `After deposit balance for ${vaultInfoPDA.toBase58()}: ${
        afterDepositBalSOL / LAMPORTS_PER_SOL
      }`
    );

    assert(afterDepositBalSOL === beforeDepositBalance + Number(depositAmount));

    // Verify updated balance for vGEM ATA
    const afterBalanceATA = await provider.connection.getTokenAccountBalance(
      associatedTokenAccount
    );
    assert(Number(afterBalanceATA.value.amount) === Number(depositAmount));

    // Deposit a 2nd time
    const signature2 = await program.methods
      .deposit(depositAmount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        mint: mintPDA,
        destination: associatedTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log(
      `#2 DEPOSIT_SOL transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );

    // Verify the vault_info account holds the correct amount of SOL after the deposit
    const finalDepositBalSOL = await provider.connection.getBalance(
      vaultInfoPDA
    );

    assert(finalDepositBalSOL === afterDepositBalSOL + Number(depositAmount));

    // Verify final balance for vGEM ATA
    const finalBalanceATA = await provider.connection.getTokenAccountBalance(
      associatedTokenAccount
    );
    assert(
      Number(finalBalanceATA.value.amount) ===
        Number(afterBalanceATA.value.amount) + Number(depositAmount)
    );
  });

  it("Withdraws 1.5 SOL twice", async () => {
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintPDA,
      provider.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Get the starting SOL balance of the vault_info account before deposit
    const vaultBeforeWithdrawBalSOL = await provider.connection.getBalance(
      vaultInfoPDA
    );

    const userBeforeWithdrawBalSOL = await provider.connection.getBalance(
      provider.publicKey
    );

    // Verify initial balance for vGEM ATA
    const ataBeforeWithdrawBal =
      await provider.connection.getTokenAccountBalance(associatedTokenAccount);

    console.log(
      `\n----------------
  BEFORE withdraw balances
  VAULT: ${vaultBeforeWithdrawBalSOL / LAMPORTS_PER_SOL} SOL
  USER: ${userBeforeWithdrawBalSOL / LAMPORTS_PER_SOL} SOL
  ATA: ${Number(ataBeforeWithdrawBal.value.amount) / LAMPORTS_PER_SOL} vGEM`
    );

    const withdrawAmount = new BN(1.5 * LAMPORTS_PER_SOL);

    const signature = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        mint: mintPDA,
        burnAta: associatedTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // const tx = await program.methods
    //   .withdraw(withdrawAmount)
    //   .accounts({
    //     vaultInfo: vaultInfoPDA,
    //     mint: mintPDA,
    //     burnAta: associatedTokenAccount,
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
    const vaultAfterWithdrawBalSOL = await provider.connection.getBalance(
      vaultInfoPDA
    );

    const userAfterWithdrawBalSOL = await provider.connection.getBalance(
      provider.publicKey
    );

    let afterBalanceATA = await provider.connection.getTokenAccountBalance(
      associatedTokenAccount
    );

    console.log(
      `\n----------------
  AFTER 1st withdraw balances
  VAULT: ${vaultAfterWithdrawBalSOL / LAMPORTS_PER_SOL} SOL
  USER: ${userAfterWithdrawBalSOL / LAMPORTS_PER_SOL} SOL
  ATA: ${Number(afterBalanceATA.value.amount) / LAMPORTS_PER_SOL} vGEM`
    );

    // SOL was returned to the user
    assert(
      vaultAfterWithdrawBalSOL ===
        vaultBeforeWithdrawBalSOL - Number(withdrawAmount)
    );

    const baseFeeLamports = 5000;
    assert(
      userAfterWithdrawBalSOL ===
        userBeforeWithdrawBalSOL + Number(withdrawAmount) - baseFeeLamports
    );

    // Verify updated balance for vGEM ATA
    assert(
      Number(afterBalanceATA.value.amount) ===
        Number(ataBeforeWithdrawBal.value.amount) - Number(withdrawAmount)
    );

    // Withdraw the rest
    const signature2 = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        mint: mintPDA,
        burnAta: associatedTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log(
      `WITHDRAW_SOL transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );

    // Verify the vault_info account holds the correct amount of SOL after the deposit
    const vaultFinalWithdrawBalSOL = await provider.connection.getBalance(
      vaultInfoPDA
    );

    const userFinalWithdrawBalSOL = await provider.connection.getBalance(
      provider.publicKey
    );

    let finalBalanceATA = await provider.connection.getTokenAccountBalance(
      associatedTokenAccount
    );

    console.log(
      `\n----------------
  AFTER 2nd withdraw balances
  VAULT: ${vaultFinalWithdrawBalSOL / LAMPORTS_PER_SOL} SOL
  USER: ${userFinalWithdrawBalSOL / LAMPORTS_PER_SOL} SOL
  ATA: ${Number(finalBalanceATA.value.amount) / LAMPORTS_PER_SOL} vGEM`
    );

    // SOL was returned to the user
    assert(
      vaultFinalWithdrawBalSOL ===
        vaultAfterWithdrawBalSOL - Number(withdrawAmount)
    );

    assert(
      userFinalWithdrawBalSOL ===
        userAfterWithdrawBalSOL + Number(withdrawAmount) - baseFeeLamports
    );

    // Verify updated balance for vGEM ATA
    assert(
      Number(finalBalanceATA.value.amount) ===
        Number(afterBalanceATA.value.amount) - Number(withdrawAmount)
    );
  });
});
