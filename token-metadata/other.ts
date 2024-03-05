import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { BN } from "bn.js";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
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
} from "@solana/spl-token";
import { assert } from "chai";

// const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const USDC_DECIMALS = 6;
const USDC_DECIMALS_MUL = 1000000;

describe("USDC vault", () => {
  //   Configure the client to use the local cluster.
  //   const provider = anchor.AnchorProvider.env();
  //   anchor.setProvider(provider);

  //   const program = anchor.workspace.Vault as Program<Vault>;

  //   // Setup custom USDC mint and vault token account
  //   let utilKeypair = anchor.web3.Keypair.generate();

  //   before(async () => {
  //     USDC_MINT = await createMint(
  //       provider.connection,
  //       utilKeypair,
  //       utilKeypair.publicKey,
  //       utilKeypair.publicKey,
  //       USDC_DECIMALS
  //     );
  //   });

  let provider: anchor.Provider;
  let program: Program<Vault>;
  let utilKeypair: anchor.web3.Keypair;
  let USDC_MINT: PublicKey;

  before(async () => {
    provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
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
    USDC_MINT = await createMint(
      provider.connection,
      utilKeypair,
      utilKeypair.publicKey,
      utilKeypair.publicKey,
      USDC_DECIMALS
    );
  });

  //   const [vaultInfoPDA, vaultInfoBump] = PublicKey.findProgramAddressSync(
  //     [anchor.utils.bytes.utf8.encode("vault"), USDC_MINT.toBuffer()],
  //     program.programId
  //   );

  //   let vaultUsdcAtaAddress = getAssociatedTokenAddressSync(
  //     USDC_MINT,
  //     vaultInfoPDA,
  //     true
  //   );
  //   if (provider.connection.getAccountInfo(vaultUsdcAtaAddress) == null) {
  //     let createAtaIx = createAssociatedTokenAccountInstruction(
  //       provider.wallet.publicKey,
  //       vaultUsdcAtaAddress,
  //       vaultInfoPDA,
  //       USDC_MINT
  //     );
  //     let usdcSetupTx = new anchor.web3.Transaction().add(createAtaIx);

  //     // Sign and send the transaction
  //     provider.sendAndConfirm(usdcSetupTx).then((signature) => {
  //       console.log(
  //         `vaultUsdcAta account created: ${vaultUsdcAtaAddress.toBase58()} with signature ${signature}`
  //       );
  //     });
  //   }

  //   const [lpMintPDA] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("lp_mint")],
  //     program.programId
  //   );

  //   const metadata = {
  //     name: "GEM Vault LP Token",
  //     symbol: "vGEM",
  //     uri: "https://raw.githubusercontent.com/jakerumbles/Vault/master/token-metadata/vGEM.json",
  //     decimals: USDC_DECIMALS,
  //   };

  //   // const tokenProgram = new PublicKey(
  //   //   // "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  //   //   TOKEN_PROGRAM_ID
  //   // );

  //   const [tokenAccountPDA, tokenAccountBump] = PublicKey.findProgramAddressSync(
  //     [anchor.utils.bytes.utf8.encode("SOLmint")],
  //     program.programId
  //   );

  it("Is initialized!", async () => {
    console.log("HELLOOOOOOO");
  });
});
