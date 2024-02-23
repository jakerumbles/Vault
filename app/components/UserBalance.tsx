"use client";

import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const UserBalance = () => {
  // State to store the user's SOL balance
  const [solBalance, setSolBalance] = useState<Number | null>(null);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // Function to fetch the user's SOL balance from the API
  const fetchSolBalance = async () => {
    console.log(
      "fetchSolBalance called with publicKey: ",
      publicKey?.toBase58()
    );
    try {
      if (!publicKey) {
        return;
      }
      // Make API call to fetch the SOL balance
      const balance = await connection.getBalance(publicKey);
      // Update the state with the fetched SOL balance
      setSolBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
    }
  };

  // Use effect hook to fetch the SOL balance when the component mounts
  useEffect(() => {
    if (!connection || !publicKey) {
      return;
    }

    // Ensure the balance updates after the transaction completes
    connection.onAccountChange(
      publicKey,
      (updatedAccountInfo) => {
        setSolBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
      },
      "confirmed"
    );

    fetchSolBalance();
  }, [connection, publicKey]); // Empty dependency array ensures the effect runs only once on component mount

  return (
    <div>
      <h2>User SOL Balance</h2>
      <p>{solBalance !== null ? `${solBalance} SOL` : "Loading..."}</p>
    </div>
  );
};
