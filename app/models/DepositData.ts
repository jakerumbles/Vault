import * as borsh from "@coral-xyz/borsh";
import { PublicKey } from "@solana/web3.js";

export class PerpsPool {
  name: string;
  custodies: PublicKey[]; // Array of publicKey strings
  ratios: TokenRatio[];
  aumUsd: bigint; // u128
  bump: number; // u8
  lpTokenBump: number; // u8
  inceptionTime: bigint; // i64

  constructor(
    name: number,
    custodies: PublicKey[],
    ratios: TokenRatio[],
    aumUsd: bigint,
    bump: number,
    lpTokenBump: number,
    inceptionTime: bigint
  ) {
    this.name = name;
    this.custodies = custodies;
    this.ratios = ratios;
    this.aumUsd = aumUsd;
    this.bump = bump;
    this.lpTokenBump = lpTokenBump;
    this.inceptionTime = inceptionTime;
  }

  borshInstructionSchema = borsh.struct([
    borsh.str("name"),
    borsh.u64("amount"),
  ]);

  //   static borshAccountSchema = borsh.struct([
  //     borsh.bool("initialized"),
  //     borsh.u8("rating"),
  //     borsh.str("title"),
  //     borsh.str("description"),
  //   ]);

  serialize(): Buffer {
    const buffer = Buffer.alloc(1000);
    // Variant 1 for deposit_sol instruction
    this.borshInstructionSchema.encode({ ...this, variant: 1 }, buffer);
    // return buffer.slice(0, this.borshInstructionSchema.getSpan(buffer));
    return buffer.subarray(0, this.borshInstructionSchema.getSpan(buffer));
  }

  //   static deserialize(buffer?: Buffer): Movie | null {
  //     if (!buffer) {
  //       return null;
  //     }

  //     try {
  //       const { title, rating, description } =
  //         this.borshAccountSchema.decode(buffer);
  //       return new Movie(title, rating, description);
  //     } catch (error) {
  //       console.log("Deserialization error: ", error);
  //       return null;
  //     }
  //   }
}
