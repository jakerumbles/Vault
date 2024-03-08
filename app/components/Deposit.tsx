import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
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
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { USDC_MINT, USDC_DECIMALS_MUL } from "@/tokenInfo";

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
    const amount = new BN(amountNum * USDC_DECIMALS_MUL);
    handleTransactionSubmit(amount);
  };

  const handleTransactionSubmit = async (amount: anchor.BN) => {
    let tx = new web3.Transaction();

    // const [vaultInfoPDA, vaultInfoBump] = PublicKey.findProgramAddressSync(
    //   [anchor.utils.bytes.utf8.encode("SOLvault")],
    //   program.programId
    // );

    const [vaultInfoPDA, vaultInfoBump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("vault"), USDC_MINT.toBuffer()],
      program.programId
    );

    // Already created from `initialize` instruction
    const [lpMintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("lp_mint")],
      program.programId
    );

    // Get the vault's ATA for the supported token
    const depositVaultTokenAccount = await getAssociatedTokenAddress(
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
      let createVaultUsdcAtaIx = createAssociatedTokenAccountInstruction(
        provider.publicKey,
        depositVaultTokenAccount,
        vaultInfoPDA,
        USDC_MINT
      );

      tx.add(createVaultUsdcAtaIx);
    }

    // Get the user's ATA for the supported token
    const depositUserTokenAccount = await getAssociatedTokenAddress(
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
      let createUserUsdcAtaIx = createAssociatedTokenAccountInstruction(
        provider.publicKey,
        depositUserTokenAccount,
        provider.publicKey,
        USDC_MINT
      );
      tx.add(createUserUsdcAtaIx);
    }

    // Get the user's ATA for the vault's LP token
    const userLpTokenAccount = await getAssociatedTokenAddress(
      lpMintPDA,
      provider.publicKey,
      true
    );

    // Check if the ATA has already aleady exists
    const userLpAtaExists = await connection.getAccountInfo(userLpTokenAccount);

    // If the ATA doesn't exist, create it
    if (!userLpAtaExists) {
      console.log(
        "Creating userLpTokenAccount account ",
        userLpTokenAccount.toBase58()
      );

      // Create the ATA account that is associated with our mint on our anchor wallet
      const createUserLpAtaIx = createAssociatedTokenAccountInstruction(
        provider.publicKey,
        userLpTokenAccount,
        provider.publicKey,
        lpMintPDA
      );

      tx.add(createUserLpAtaIx);
    }

    const depositIx = await program.methods
      .deposit(amount)
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
      .instruction();

    tx.add(depositIx);

    console.log("Instructions", tx.instructions);

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
      <div>
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
        <span>
          Deposit{" "}
          <span style={{ fontSize: "74%", fontWeight: 250 }}>get vGEM</span>
        </span>
      </Button>
    </div>
  );
};
