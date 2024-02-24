"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
import { UserBalance } from "@/components/UserBalance";
import { Deposit } from "@/components/Deposit";
import { Withdraw } from "@/components/Withdraw";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { GetProgramAccountsFilter, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Vault } from "@/components/Vault";

const tokenMap: Record<string, string> = {
  "6DHrgSeVhRF2HaNATZX6HUAuzwd6t4HQMUDWv1DcyRAP": "vGEM",
};

const supportedSplTokens = ["vGEM"];

export default function Page() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [balances, setBalances] = useState<{ [key: string]: number | null }>({
    SOL: null,
  });

  useEffect(() => {
    if (!publicKey) {
      return;
    }

    // Ensure the balance updates after the transaction completes
    connection.onAccountChange(
      publicKey,
      (updatedAccountInfo) => {
        console.log(
          "Account SOL updated:",
          updatedAccountInfo.lamports / LAMPORTS_PER_SOL
        );
        setBalances((balances) => ({
          ...balances,
          SOL: updatedAccountInfo.lamports / LAMPORTS_PER_SOL,
        }));
      },
      "confirmed"
    );

    getTokenAccounts();
  }, [connection, publicKey]);

  const getTokenAccounts = async () => {
    if (!publicKey) {
      return;
    }

    const filters: GetProgramAccountsFilter[] = [
      {
        dataSize: 165, //size of account (bytes)
      },
      {
        memcmp: {
          offset: 32, // location of our query in the account (bytes)
          bytes: publicKey.toBase58(), // our search criteria, a base58 encoded string
        },
      },
    ];

    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID, //SPL Token Program, new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      { filters: filters }
    );

    accounts.forEach((account, i) => {
      const parsedAccountInfo: any = account.account.data;
      const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"];
      const ataAddress = account.pubkey;
      const tokenBalance: number =
        parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];

      console.log(`Token Account No. ${i + 1}: ${ataAddress.toString()}`);
      console.log(`--Token Mint: ${mintAddress}`);
      console.log(`--Token Balance: ${tokenBalance}`);

      if (supportedSplTokens.includes(tokenMap[mintAddress])) {
        setBalances((balances) => ({
          ...balances,
          [tokenMap[mintAddress]]: tokenBalance,
        }));

        // Ensure the balance updates for supported SPL tokens the account holds after the transaction completes
        connection.onAccountChange(ataAddress, (updatedAccountInfo) => {
          connection.getTokenAccountBalance(ataAddress).then((balance) => {
            const ataBalance = balance.value.uiAmount;
            console.log(
              `Updated ${tokenMap[mintAddress]} balance:`,
              ataBalance
            );
            setBalances((balances) => ({
              ...balances,
              [tokenMap[mintAddress]]: ataBalance,
            }));
          });
        });
      }
    });
  };

  // Function to fetch the user's SOL balance from the API
  const fetchSolBalance = async () => {
    try {
      if (!publicKey) {
        return;
      }
      // Make API call to fetch the SOL balance
      const balance = await connection.getBalance(publicKey);
      // Update the state with the fetched SOL balance
      // setBalance(balance / LAMPORTS_PER_SOL);
      setBalances((balances) => ({
        ...balances,
        SOL: balance / LAMPORTS_PER_SOL,
      }));
      console.log("Updated SOL balance:", balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
    }
  };

  return (
    <div className="container mx-auto">
      <Vault
        depositTokenSymbol="SOL"
        depositTokenBalance={balances["SOL"]}
        withdrawTokenSymbol="vGEM"
        withdrawTokenBalance={0}
      />
    </div>
  );
}
