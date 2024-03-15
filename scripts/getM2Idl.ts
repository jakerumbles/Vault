import {
  Connection,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import {
  Address,
  web3,
  AnchorProvider,
  setProvider,
  Program,
  Wallet,
} from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function getIdl() {
  const keypair = web3.Keypair.generate();
  const provider = new AnchorProvider(connection, new Wallet(keypair), {});
  setProvider(provider);
  // m2 nft marketplace program
  const programId = new PublicKey(
    "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K"
  );
  let m2Idl = await Program.fetchIdl(programId, provider);
  if (!m2Idl) {
    throw new Error("Unable to fetch IDL");
  }

  let idlJson = JSON.stringify(m2Idl);

  const filePath = path.join(__dirname, "m2Idl.json");
  try {
    fs.writeFileSync(filePath, idlJson);
    console.log("JSON file written successfully");
  } catch (error) {
    console.error("Failed to write JSON file:", error);
  }
}

getIdl();
