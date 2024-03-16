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
  BN,
} from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
// import { IDL } from "../../../../m2/src/types/m2";
// import { IDL } from "/Users/jake/Github/m2/target/types/m2";
import { IDL } from "/Users/jake/Github/perps-dex/target/types/perpetuals";

import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { use } from "chai";
import { Pool } from "./Pool";
import { perpPoolSchema, PerpPool } from "@/types/types";
// import idl from "/Users/jake/Github/perps-dex/target/idl/perpetuals.json";
// import idl from "../../idl/perpetuals.json";
// import { IDL as idl } from "../../idl/perpetuals.json";

// const idl_string = JSON.stringify(idl);
// const idl_object = JSON.parse(idl_string);
// const programID = new PublicKey(idl_object.metadata.address);

export const Perps = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [pools, setPools] = useState<string[]>([]);

  const SUPPORTED_PERPS = ["USDC", "ETH"];

  if (!wallet) {
    return <div>Wallet not connected</div>;
  }

  // useEffect(() => {
  //   getPools();
  // }, [connection, wallet]);

  const provider = new AnchorProvider(connection, wallet, {});
  setProvider(provider);

  // Gems DAO Perpetuals program on devnet
  const programId = new PublicKey(
    "BmGHT8ie43LUYfshidXt4unQQDC5cBgbY8EyEcQJ2CSJ"
  );

  const program = new Program(IDL, programId, provider);

  console.log("Loaded perpetuals program: ", program.programId.toString());

  const handlePress = (event: any) => {
    // event.preventDefault();
    console.log("Testing perpetuals program...");

    handleList();
  };

  const handleList = async () => {
    let tx = new web3.Transaction();

    // Devnet USDC
    const tokenMint = new PublicKey(
      "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    );
  };

  const getPools = async () => {
    let pools: string[] = [];

    SUPPORTED_PERPS.forEach(async (perp_name) => {
      const [poolAddress, poolBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), Buffer.from(perp_name)],
        program.programId
      );
      console.log("Pool Address: ", poolAddress.toString());
      console.log("Pool bump: ", poolBump);

      const pool = await program.account.pool.fetch(poolAddress);
      let pool_str = JSON.stringify(pool);
      let pool_json = JSON.parse(pool_str);
      console.log("Pool name: ", pool_json["name"]);
      console.log("Pool type: ", typeof pool);
      console.log("Pool: ", pool);
      pools.push(pool_str);
    });

    setPools(pools);
  };

  const poolName = "USDC";
  return (
    <div className="flex flex-col m-4 w-56 gap-4">
      <h1>Perpetuals</h1>
      <Button onClick={getPools}>Test Perpetuals</Button>
      {pools.map((pool, i) => (
        <Pool key={i} pool_json_str={pool} />
      ))}
    </div>
  );
};
