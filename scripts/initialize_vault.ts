import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { BN } from "bn.js";
import { PublicKey, Transaction } from "@solana/web3.js";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// TOKEN ACCEPTED BY VAULT
// const USDC.devnet.mint = new PublicKey(
//   "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
// );
// const TOKEN_DECIMALS = 6;
// const TOKEN_DECIMALS_MUL = 1000000;

// const metadata = {
//   name: "USDT Vault LP Token",
//   symbol: "vUSDT",
//   uri: "https://raw.githubusercontent.com/jakerumbles/Vault/master/token-metadata/vGEM.json",
//   decimals: TOKEN_DECIMALS,
// };

const USDC = {
  devnet: {
    mint: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
    decimals: 6,
    decimal_multiplier: 1000000,
    lpMetadata: {
      name: "USDC Vault LP Token",
      symbol: "vUSDC",
      uri: "https://raw.githubusercontent.com/jakerumbles/Vault/master/token-metadata/vGEM.json",
      decimals: 6,
    },
  },
};

// Instruction args
const maxBalance = new BN(10000 * USDC.devnet.decimal_multiplier);

async function initialize_vault() {
  console.log("Initializing vault...");
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  let program: Program<Vault>;
  let vaultInfoPDA: PublicKey;
  let vaultInfoBump: number;
  let depositVaultTokenAccount: PublicKey;
  let lpMintPDA: PublicKey;
  let metadataAddress: PublicKey;

  program = anchor.workspace.Vault as Program<Vault>;
  let tx = new Transaction();

  // ----GET ALL ACCOUNTS----

  // Vault for `tokenMint` token
  [vaultInfoPDA, vaultInfoBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("vault"), USDC.devnet.mint.toBuffer()],
    program.programId
  );

  [lpMintPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("lp_mint"), USDC.devnet.mint.toBuffer()],
    program.programId
  );

  // Derive the metadata account address.
  [metadataAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      lpMintPDA.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  depositVaultTokenAccount = getAssociatedTokenAddressSync(
    USDC.devnet.mint,
    vaultInfoPDA,
    true
  );

  let vaultTokenAtaExists = await provider.connection.getAccountInfo(
    depositVaultTokenAccount
  );
  if (!vaultTokenAtaExists) {
    console.log(
      "Creating depositVaultTokenAccount account ",
      depositVaultTokenAccount.toBase58()
    );
    let createAtaIx = createAssociatedTokenAccountInstruction(
      provider.publicKey,
      depositVaultTokenAccount,
      vaultInfoPDA,
      USDC.devnet.mint
    );

    tx.add(createAtaIx);
  }

  let init_ix = await program.methods
    .initializeVault(maxBalance, USDC.devnet.lpMetadata)
    .accounts({
      metadata: metadataAddress,
      vaultInfo: vaultInfoPDA,
      depositMint: USDC.devnet.mint,
      depositVaultTokenAccount: depositVaultTokenAccount,
      payer: provider.publicKey,
      lpMint: lpMintPDA,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .instruction();

  tx.add(init_ix);

  const signature = await provider.sendAndConfirm(tx);

  console.log("Vault initialized with signature", signature);
}

initialize_vault();
