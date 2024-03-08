import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
import { Deposit } from "@/components/Deposit";
import { Withdraw } from "@/components/Withdraw";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { GetProgramAccountsFilter } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface VaultInfo {
  depositTokenSymbol: string;
  withdrawTokenSymbol: string;
  depositTokenBalance: number | null;
  withdrawTokenBalance: number | null;
}

export const Vault = (vaultInfo: VaultInfo) => {
  return (
    <div className="flex md:flex-row md:justify-center gap-7">
      {/* Deposit component */}
      <div className="flex flex-col items-center m-4 w-56 gap-4">
        <Deposit
          tokenSymbol={vaultInfo.depositTokenSymbol}
          tokenBalance={vaultInfo.depositTokenBalance}
        />
      </div>

      {/* Withdraw component */}
      <div className="flex flex-col items-center m-4 w-56 gap-4">
        <Withdraw
          tokenSymbol={vaultInfo.withdrawTokenSymbol}
          tokenBalance={vaultInfo.withdrawTokenBalance}
        />
      </div>
    </div>
  );
};
