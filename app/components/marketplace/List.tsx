"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
import {
  Address,
  web3,
  AnchorProvider,
  setProvider,
  Program,
} from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
// import { IDL } from "../../../../m2/src/types/m2";
// import { IDL } from "/Users/jake/Github/m2/target/types/m2";
import { IDL } from "../../idl/m2Idl";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

export const List = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  // const [m2Idl, setM2Idl] = useState<anchor.Idl>();
  // const [program, setProgram] = useState<Program>();

  // useEffect(() => {
  //   const getIdl = async () => {
  //     if (!wallet) {
  //       return <div>Wallet not connected</div>;
  //     }
  //
  //     // m2 nft marketplace program
  //
  //     let m2Idl = await Program.fetchIdl(programId, provider);
  //     if (!m2Idl) {
  //       throw new Error("Unable to fetch IDL");
  //     }

  //     let idlJson = JSON.stringify(m2Idl);

  //     const filePath = pathT.join(__dirname, "m2Idl.json");
  //     try {
  //       fileSys.writeFileSync(filePath, idlJson);
  //       console.log("JSON file written successfully");
  //     } catch (error) {
  //       console.error("Failed to write JSON file:", error);
  //     }

  //     // setM2Idl(m2Idl);
  //     console.log("M2 IDL: ", idlJson);
  //     const program = new Program(m2Idl, programId);
  //     // console.log("Program: ", program);
  //     setProgram(program);
  //   };

  //   getIdl();
  // }, []); // Empty dependency array means this effect runs once after the first render

  if (!wallet) {
    return <div>Wallet not connected</div>;
  }

  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  setProvider(provider);

  const programId = new PublicKey(
    "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K"
  );

  const program = new Program(IDL, programId);

  console.log("Loaded M2 program: ", program.programId.toString());

  const handlePress = (event: any) => {
    // event.preventDefault();
    console.log("Listing NFT");

    handleList();
  };

  const handleList = async () => {
    let tx = new web3.Transaction();

    //   pub fn sell<'info>(
    //     ctx: Context<'_, '_, '_, 'info, Sell<'info>>,
    //     _seller_state_bump: u8,
    //     program_as_signer_bump: u8,
    //     buyer_price: u64,
    //     token_size: u64,
    //     seller_state_expiry: i64,
    // ) -> Result<()> {

    const notary = web3.Keypair.generate();

    // Devnet USDC
    const tokenMint = new PublicKey(
      "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    );

    // I think this is the NFT account
    const tokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      provider.publicKey,
      true
    );

    // Same as tokenAccount for now
    const tokenAta = await getAssociatedTokenAddress(
      tokenMint,
      provider.publicKey,
      true
    );

    const [metadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        tokenMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const authority = web3.Keypair.generate();

    // [Buffer.from("lp_mint"), USDC_MINT.toBuffer()],
    const PREFIX = "m2";
    const TREASURY = "treasury";
    const auctionHouse = PublicKey.findProgramAddressSync([
      Buffer.from(PREFIX),
      auction_house.key().as_ref(),
      Buffer.from(TREASURY),
    ]);

    const sellerStateBump = 1;
    const programAsSignerBump = 2;
    const buyerPrice = new BN(1000000000);
    const tokenSize = new BN(500000);
    const sellerStateExpiry = new BN(1000000000);

    const sellTx = await program.methods
      .sell(
        sellerStateBump,
        programAsSignerBump,
        buyerPrice,
        tokenSize,
        sellerStateExpiry
      )
      .accounts({
        wallet: provider.publicKey,
        notary: notary.publicKey,
        tokenAccount: tokenAccount,
        tokenAta: tokenAta,
        tokenMint: tokenMint,
        metadata: metadata,
        authority: authority.publicKey,
        auctionHouse: auctionHouse,
        sellerTradeState: sellerTradeState,
        sellerReferral: sellerReferral,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        programAsSigner: program.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();
  };

  return (
    <div className="flex flex-col m-4 w-56 gap-4">
      <div>
        <h1>NFT Marketplace!</h1>
      </div>
      <Input
        type="number"
        label="Price"
        value="0"
        onChange={(e) => console.log(e.target.value)}
      />
      <Button color="primary" onPress={handlePress}>
        <span>List NFT</span>
      </Button>
    </div>
  );
};
