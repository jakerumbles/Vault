import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { BN } from "bn.js";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

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
    name: "Solana Gold",
    symbol: "GOLDSOL",
    uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
  };

  const tokenProgram = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  );

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
    const decimals = 9;

    const tx = await program.methods
      .initialize(maxBalance, decimals)
      .accounts({
        vaultInfo: vaultInfoPDA,
        provider: provider.publicKey,
        mintAccount: mintPDA,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: tokenProgram,
      })
      // .signers([mint])
      .rpc();

    console.log(
      `View transaction: https://explorer.solana.com/tx/${tx}?cluster=custom`
    );
  });

  it("Deposits 1.5 SOL", async () => {
    const amount = new BN(1.5 * LAMPORTS_PER_SOL);

    const tx = await program.methods
      .depositSol(amount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        depositor: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(
      `View transaction: https://explorer.solana.com/tx/${tx}?cluster=custom`
    );
  });
});
