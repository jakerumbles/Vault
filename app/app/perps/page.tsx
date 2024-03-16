"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
import { Deposit } from "@/components/Deposit";
import { Withdraw } from "@/components/Withdraw";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { GetProgramAccountsFilter, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Vault } from "@/components/Vault";
import { Perps } from "@/components/perps/Perps";

export default function Page() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return (
    <div className="container mx-auto max-w-4xl">
      <Perps />
    </div>
  );
}
