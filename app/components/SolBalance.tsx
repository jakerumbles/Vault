"use client";

import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, GetProgramAccountsFilter } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenInfo } from "./Deposit";

export const SolBalance = () => {
  // State to store the user's SOL balance
  const [balance, setBalance] = useState<Number | null>(null);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  // Function to fetch the user's SOL balance from the API
  const fetchSolBalance = async () => {
    try {
      if (!publicKey) {
        return;
      }
      // Make API call to fetch the SOL balance
      const balance = await connection.getBalance(publicKey);
      // Update the state with the fetched SOL balance
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
    }
  };

  // Function to fetch the user's SPL token balance from the API
  // const fetchAtaBalance = async () => {
  //   try {
  //     if (!publicKey) {
  //       return;
  //     }

  //     setBalance(999);
  //   } catch (error) {
  //     console.error("Error fetching SPL token balance:", error);
  //   }
  // };

  // Fetch the balance of some token for the user
  // const fetchBalance = async () => {
  //   console.log(
  //     `Fetching ${tokenName} balance for with publicKey: ${publicKey?.toBase58()}`
  //   );

  //   if (tokenName === "SOL") {
  //     fetchSolBalance();
  //   } else {
  //     fetchAtaBalance();
  //   }
  // };

  // Use effect hook to fetch the SOL balance when the component mounts
  useEffect(() => {
    if (!connection || !publicKey) {
      return;
    }

    // Ensure the balance updates after the transaction completes
    connection.onAccountChange(
      publicKey,
      (updatedAccountInfo) => {
        setBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
      },
      "confirmed"
    );

    // connection.onProgramAccountChange();

    fetchSolBalance();
  }, [connection, publicKey]); // Re-run the effect when the connection or public key changes

  return (
    <div>
      {/* <h2>User SOL Balance</h2> */}
      <p>{balance !== null ? `${balance} SOL` : "Loading..."}</p>
    </div>
  );
};
