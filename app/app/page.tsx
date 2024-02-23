"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
import { UserBalance } from "@/components/UserBalance";
import { Deposit } from "@/components/Deposit";

export default function Page() {
  return (
    <div className="container mx-auto">
      <div className="flex">
        <UserBalance />
      </div>
      <div className="flex flex-row gap-7">
        <Deposit />

        {/* Make Withdraw component */}
        <div className="flex flex-col m-4 w-56 gap-4">
          <Input type="number" label="SOL" />
          <Button color="secondary">Withdraw</Button>
        </div>
      </div>
    </div>
  );
}
