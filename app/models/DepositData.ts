import * as borsh from "@coral-xyz/borsh";

export class DepositData {
  amount: number;

  constructor(amount: number) {
    this.amount = amount;
  }

  borshInstructionSchema = borsh.struct([
    borsh.u8("variant"),
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
