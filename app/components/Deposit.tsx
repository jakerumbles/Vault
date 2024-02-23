import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";

export const Deposit = () => {
  const [depositAmount, setDepositAmount] = useState("");

  const handleDeposit = () => {
    // TODO: Add deposit amount check
    console.log("Depositing", depositAmount);
  };

  return (
    <div className="flex flex-col m-4 w-56 gap-4">
      <Input
        type="number"
        label="SOL"
        value={depositAmount}
        onChange={(e) => setDepositAmount(e.target.value)}
      />
      <Button color="primary" onPress={handleDeposit}>
        Deposit
      </Button>
    </div>
  );
};
