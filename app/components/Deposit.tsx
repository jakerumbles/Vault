import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
import { DepositData } from "../models/DepositData";
import { Address, web3 } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, setProvider, Program } from "@coral-xyz/anchor";
import { IDL } from "../idl/vault";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  ACCOUNT_SIZE,
} from "@solana/spl-token";
import { UserBalance } from "./UserBalance";

export interface TokenInfo {
  tokenSymbol: string;
  tokenBalance: number | null;
}

export const Deposit = ({ tokenSymbol, tokenBalance }: TokenInfo) => {
  const [depositAmount, setDepositAmount] = useState("");

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

  //   const handlePress = () => {
  //     // TODO: Add deposit amount check
  //     console.log("Depositing", depositAmount);
  //   };

  const handlePress = (event: any) => {
    // event.preventDefault();
    console.log("Depositing", depositAmount);

    const amountNum = Number(depositAmount);
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

    // Check if the ATA has already aleady exists
    const ataAccount = await connection.getAccountInfo(associatedTokenAccount);

    // If the ATA doesn't exist, create it
    if (!ataAccount) {
      console.error("ATA not found, so now creating it");

      // Create the ATA account that is associated with our mint on our anchor wallet
      const createATAIx = createAssociatedTokenAccountInstruction(
        provider.publicKey,
        associatedTokenAccount,
        provider.publicKey,
        mintPDA
      );

      tx.add(createATAIx);
    }

    const depositIx = await program.methods
      .depositSol(amount)
      .accounts({
        vaultInfo: vaultInfoPDA,
        mint: mintPDA,
        destination: associatedTokenAccount,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    tx.add(depositIx);

    // Sign and send the transaction
    const signature = await provider.sendAndConfirm(tx);

    console.log(
      `Transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );

    // Clear the input field
    setDepositAmount("");
  };

  return (
    <div className="flex flex-col m-4 w-56 gap-4">
      {/* <UserBalance
        tokenSymbol={tokenInfo.tokenSymbol}
        tokenBalance={tokenInfo.tokenBalance}
      /> */}
      <div>
        {/* <h2>User SOL Balance</h2> */}
        <p>
          {tokenBalance !== null
            ? `${tokenBalance} ${tokenSymbol}`
            : "Loading..."}
        </p>
      </div>
      <Input
        type="number"
        label={tokenSymbol}
        value={depositAmount}
        onChange={(e) => setDepositAmount(e.target.value)}
      />
      <Button color="primary" onPress={handlePress}>
        Deposit
      </Button>
    </div>
  );
};
