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

describe("vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const program = anchor.workspace.Vault as Program<Vault>;

  const [vaultInfoPDA, vaultInfoBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("SOLvault")],
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

    const maxBalance = new BN(10 * LAMPORTS_PER_SOL);

    let signature = await program.methods
      .initialize(maxBalance, metadata)
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

  it("Deposits 1.5 SOL", async () => {
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

    const amount = new BN(1.5 * LAMPORTS_PER_SOL);

    // const signature = await program.methods
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
    //   .rpc();

    const tx = await program.methods
      .depositSol(amount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        mint: mintPDA,
        destination: associatedTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();

    let blockhash = (await provider.connection.getLatestBlockhash("finalized"))
      .blockhash;
    tx.recentBlockhash = blockhash;
    tx.feePayer = provider.wallet.publicKey;
    provider.wallet.signTransaction(tx);

    const signature = await provider.connection.sendRawTransaction(
      tx.serialize(),
      {
        skipPreflight: true,
      }
    );

    console.log(
      `DEPOSIT_SOL transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );
  });
});
