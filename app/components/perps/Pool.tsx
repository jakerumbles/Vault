import React, { useEffect, useState } from "react";

interface PoolI {
  pool_json_str: string;
}

export const Pool: React.FC<PoolI> = ({ pool_json_str }) => {
  const [pool, setPool] = useState<any>({});
  useEffect(() => {
    console.log("HELLO FROM POOL COMPONENT");
    console.log("Pool_json_str: ", pool_json_str);
    let pool = JSON.parse(pool_json_str);
    console.log("Pool NAME: ", pool["name"]);
    setPool(pool);
  }, []);

  return (
    <div>
      <h1>Init Pool</h1>
      <div>
        <div>
          <p>Pool Name: {pool["name"]}</p>
          <p>AUM: {pool["aumUsd"]}</p>
          <p>Bump: {pool["bump"]}</p>
          <p>LP Token Bump: {pool["lpTokenBump"]}</p>
          <p>Inception Time: {pool["inceptionTime"]}</p>
        </div>
      </div>
    </div>
  );
};
