// import {
//   LOCALHOST,
//   tmpLedgerDir,
//   localDeployPath,
// } from "@metaplex-foundation/amman";
// const { LOCALHOST, programIds } = require("@metaplex-foundation/amman");

const LOCALHOST = "http://localhost:8899";
const WSLOCALHOST = "ws://localhost:8900/";

module.exports = {
  validator: {
    killRunningValidators: true,
    programs: [
      {
        label: "Token Metadata Program",
        programId: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        deployPath: localDeployPath("mpl_token_metadata"),
      },
    ],
    jsonRpcUrl: LOCALHOST,
    websocketUrl: WSLOCALHOST,
    commitment: "singleGossip",
    ledgerDir: ".anchor/ledger",
    resetLedger: true,
    verifyFees: false,
    detached: process.env.CI != null,
  },
  relay: {
    enabled: process.env.CI == null,
    killlRunningRelay: true,
  },
  storage: {
    enabled: process.env.CI == null,
    storageId: "mock-storage",
    clearOnStart: false,
  },
};

function localDeployPath(program) {
  switch (program) {
    case "mpl_token_metadata":
      // return "../metaplex-program-library/target/deploy/mpl_token_metadata.so";
      return "/Users/jake/Github/mpl-token-metadata/programs/.bin/token_metadata.so";
    default:
      throw new Error(`Unknown program ${program}`);
  }
}
