import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { BN } from "bn.js";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const program = anchor.workspace.Vault as Program<Vault>;

  const [vaultInfoPDA, _] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("SOLvault")],
    program.programId
  );

  it("Is initialized!", async () => {
    const maxBalance = new BN(10 * LAMPORTS_PER_SOL);

    const tx = await program.methods
      .initialize(maxBalance)
      .accounts({
        vaultInfo: vaultInfoPDA,
        provider: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
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
