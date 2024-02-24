import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
import { web3 } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, setProvider, Program } from "@coral-xyz/anchor";
import { IDL } from "../../target/types/vault";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";
import {
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { UserBalance } from "./UserBalance";

export const Withdraw = () => {
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) {
    return <div>Wallet not connected</div>;
  }

  const provider = new AnchorProvider(connection, wallet, {});
  setProvider(provider);

  // Vault program
  const programId = new PublicKey(
    "7JCk8GRuxk8KfE6ttP7qx3QdGPDCKKvHyQHuJmHZCAn"
  );
  const program = new Program(IDL, programId);

  const handlePress = (event: any) => {
    // event.preventDefault();
    console.log("Withdrawing", withdrawAmount);

    const amountNum = Number(withdrawAmount);
    const amount = new BN(amountNum * LAMPORTS_PER_SOL);
    handleTransactionSubmit(amount);
  };

  const handleTransactionSubmit = async (amount: any) => {
    let tx = new web3.Transaction();
    // const buffer = depositData.serialize();
    const [vaultInfoPDA, vaultInfoBump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("SOLvault")],
      program.programId
    );

    // Already created from `initialize` instruction
    const [mintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      program.programId
    );

    // Get the address for the ATA (but it might not existing on the SOL network yet)
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintPDA,
      provider.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const withdrawIx = await program.methods
      .withdraw(amount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        mint: mintPDA,
        burnAta: associatedTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    tx.add(withdrawIx);

    // Sign and send the transaction
    const signature = await provider.sendAndConfirm(tx);

    console.log(
      `Transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );

    // Clear the input field
    setWithdrawAmount("");
  };

  return (
    <div className="flex flex-col m-4 w-56 gap-4">
      {/* <UserBalance tokenSymbol={} /> */}
      <Input
        type="number"
        label="vGEM"
        value={withdrawAmount}
        onChange={(e) => setWithdrawAmount(e.target.value)}
      />
      <Button color="secondary" onPress={handlePress}>
        Withdraw
      </Button>
    </div>
  );
};
