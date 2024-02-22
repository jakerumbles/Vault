"use client";

import { Button } from "@nextui-org/button";
import { UserBalance } from "@/components/UserBalance";

export default function Page() {
  return (
    <div className="container mx-auto">
      <div>
        <UserBalance />
      </div>
      {/* <Button>Deposit</Button> */}
    </div>
  );
}
