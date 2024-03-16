import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
import { web3 } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, setProvider, Program } from "@coral-xyz/anchor";
import { IDL } from "../idl/vault";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";
import {
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { TokenInfo } from "./Deposit";
import { USDC_MINT, USDC_DECIMALS_MUL } from "@/tokenInfo";

export const Withdraw = ({ tokenSymbol, tokenBalance }: TokenInfo) => {
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
    const amount = new BN(amountNum * USDC_DECIMALS_MUL);
    handleTransactionSubmit(amount);
  };

  const handleTransactionSubmit = async (amount: any) => {
    let tx = new web3.Transaction();

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
    // Should already be created from previous deposit
    const depositVaultTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      vaultInfoPDA,
      true
    );

    // Get the user's ATA for the supported token
    // Should already be created from previous deposit
    const depositUserTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      provider.publicKey,
      true
    );

    // Get the user's ATA for the vault's LP token
    // Should already be created from previous deposit
    const userLpTokenAccount = await getAssociatedTokenAddress(
      lpMintPDA,
      provider.publicKey,
      true
    );

    // // Get the address for the ATA (but it might not existing on the SOL network yet)
    // const associatedTokenAccount = await getAssociatedTokenAddress(
    //   mintPDA,
    //   provider.publicKey,
    //   false,
    //   TOKEN_PROGRAM_ID,
    //   ASSOCIATED_TOKEN_PROGRAM_ID
    // );

    const withdrawIx = await program.methods
      .withdraw(amount)
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

    tx.add(withdrawIx);

    // Sign and send the transaction
    const signature = await provider.sendAndConfirm(tx);

    console.log(
      `Transaction: https://explorer.solana.com/tx/${signature}?cluster=custom`
    );

    // Clear the input field
    setWithdrawAmount("");
  };

  const fetchTest = async () => {
    console.log("Testing fetch...");

    const [vaultInfoPDA, vaultInfoBump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("vault"), USDC_MINT.toBuffer()],
      program.programId
    );

    console.log("Vault info PDA: ", vaultInfoPDA.toBase58());

    const vaultInfo = await program.account.vaultInfo.fetch(vaultInfoPDA);
    console.log("Vault info: ", vaultInfo.acceptedTokenMint.toBase58());
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
        value={withdrawAmount}
        onChange={(e) => setWithdrawAmount(e.target.value)}
      />
      <Button color="secondary" onPress={handlePress}>
        <span>
          Withdraw{" "}
          <span style={{ fontSize: "74%", fontWeight: 250 }}>get SOL</span>
        </span>
      </Button>
      <Button color="danger" onPress={fetchTest}>
        Test fetch
      </Button>
    </div>
  );
};
