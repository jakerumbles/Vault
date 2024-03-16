import { PublicKey } from "@solana/web3.js";
import { IDL } from "/Users/jake/Github/perps-dex/target/types/perpetuals";
import * as borsh from "@coral-xyz/borsh";
import BN from "bn.js";

export interface PerpPool {
  name: string;
  //   custodies: PublicKey[]; // Array of publicKey strings
  //   ratios: TokenRatio[];
  aumUsd: BN; // u128
  bump: number; // u8
  lpTokenBump: number; // u8
  inceptionTime: BN; // i64
}

export interface TokenRatio {
  target: string; // publicKey
  min: bigint; // u64
  max: bigint; // u64
}

export const perpPoolSchema = borsh.struct<PerpPool>([
  borsh.str("name"),
  borsh.vec(), // Array of publicKey strings
  //   borsh.array(tokenRatioSchema),
  borsh.u128("aumUsd"),
  borsh.u8("bump"),
  borsh.u8("lpTokenBump"),
  borsh.i64("inceptionTime"),
]);

// const deploymentAccountSchema = borsh.struct<PerpPool>([
//     borsh.str("name"),
//     borsh.array(borsh.laya),

//     borsh.u64("discriminator"),
//     borsh.publicKey("creator"),
//     borsh.u64("limitPerMint"),
//     borsh.u64("maxNumberOfTokens"),
//     borsh.u64("numberOfTokensIssued"),
//     borsh.u8("decimals"),
//     borsh.bool("useInscriptions"),
//     borsh.u8("deploymentType"),
//     borsh.bool("requireCreatorCosign"),
//     borsh.bool("migratedFromLegacy"),
//     borsh.u64("escrowNonFungibleCount"),
//     borsh.str("ticker"),
//     borsh.str("deploymentTemplate"),
//     borsh.str("mintTemplate"),
//     borsh.publicKey("fungibleMint"),
//     borsh.str("offchainUrl"),
//   ]);
