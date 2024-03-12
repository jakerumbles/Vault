import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { BN } from "bn.js";
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
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

// TOKEN ACCEPTED BY VAULT
const TOKEN_MINT = new PublicKey(
  "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
);
const TOKEN_DECIMALS = 6;
const TOKEN_DECIMALS_MUL = 1000000;

// Instruction args
const maxBalance = new BN(10000 * TOKEN_DECIMALS_MUL);
const metadata = {
  name: "USDT Vault LP Token",
  symbol: "vUSDT",
  uri: "https://raw.githubusercontent.com/jakerumbles/Vault/master/token-metadata/vGEM.json",
  decimals: TOKEN_DECIMALS,
};

async function initialize_vault() {
  console.log("Initializing vault...");
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  let program: Program<Vault>;
  let utilKeypair: anchor.web3.Keypair;
  let vaultInfoPDA: PublicKey;
  let vaultInfoBump: number;
  let depositVaultTokenAccount: PublicKey;
  let depositUserTokenAccount: PublicKey;
  let lpMintPDA: PublicKey;

  program = anchor.workspace.Vault as Program<Vault>;
  let tx = new Transaction();

  // ----GET ALL ACCOUNTS----

  // Vault for `tokenMint` token
  [vaultInfoPDA, vaultInfoBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("vault"), TOKEN_MINT.toBuffer()],
    program.programId
  );

  // Derive the metadata account address.
  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      lpMintPDA.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  depositVaultTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT,
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
      TOKEN_MINT
    );

    tx.add(createAtaIx);
  }

  let signature = await program.methods
    .initializeVault(maxBalance, metadata)
    .accounts({
      metadata: metadataAddress,
      vaultInfo: vaultInfoPDA,
      depositMint: TOKEN_MINT,
      depositVaultTokenAccount: depositVaultTokenAccount,
      payer: provider.publicKey,
      lpMint: lpMintPDA,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .rpc();
}

initialize_vault();
