export type Vault = {
  "version": "0.1.0",
  "name": "vault",
  "instructions": [
    {
      "name": "initializeVault",
      "docs": [
        "Initializes a new vault and sets the vault configuration.",
        "`max_balance` is expected to be in lamports.",
        "Also creates a new token mint and initializes the metadata for the token"
      ],
      "accounts": [
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "depositVaultTokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "maxBalance",
          "type": "u64"
        },
        {
          "name": "metadata",
          "type": {
            "defined": "InitTokenParams"
          }
        }
      ]
    },
    {
      "name": "deposit",
      "docs": [
        "Deposits SOL into the vault and mints LP tokens to the depositor.",
        "TODO: Make sure decimals are handled with `amount`"
      ],
      "accounts": [
        {
          "name": "vaultInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "depositVaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositUserTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraws LP tokens from the depositor and burns them, transferring SOL to the depositor."
      ],
      "accounts": [
        {
          "name": "vaultInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "depositVaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositUserTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "vaultInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "acceptedTokenMint",
            "type": "publicKey"
          },
          {
            "name": "maxBalance",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitTokenParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "decimals",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "DepositAmountTooLarge",
      "msg": "Deposit amount too large. Would cause vault to exceed max balance."
    },
    {
      "code": 6001,
      "name": "NoBalance",
      "msg": "No LP tokens to burn for withdrawal."
    },
    {
      "code": 6002,
      "name": "WithdrawAmountTooLarge",
      "msg": "Withdraw amount is greater than callers LP token balance."
    },
    {
      "code": 6003,
      "name": "InsufficientSOLForTransfer",
      "msg": "Insufficient SOL for transaction."
    }
  ]
};

export const IDL: Vault = {
  "version": "0.1.0",
  "name": "vault",
  "instructions": [
    {
      "name": "initializeVault",
      "docs": [
        "Initializes a new vault and sets the vault configuration.",
        "`max_balance` is expected to be in lamports.",
        "Also creates a new token mint and initializes the metadata for the token"
      ],
      "accounts": [
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "depositVaultTokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "maxBalance",
          "type": "u64"
        },
        {
          "name": "metadata",
          "type": {
            "defined": "InitTokenParams"
          }
        }
      ]
    },
    {
      "name": "deposit",
      "docs": [
        "Deposits SOL into the vault and mints LP tokens to the depositor.",
        "TODO: Make sure decimals are handled with `amount`"
      ],
      "accounts": [
        {
          "name": "vaultInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "depositVaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositUserTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraws LP tokens from the depositor and burns them, transferring SOL to the depositor."
      ],
      "accounts": [
        {
          "name": "vaultInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "depositVaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositUserTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userLpTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "vaultInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "acceptedTokenMint",
            "type": "publicKey"
          },
          {
            "name": "maxBalance",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitTokenParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "decimals",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "DepositAmountTooLarge",
      "msg": "Deposit amount too large. Would cause vault to exceed max balance."
    },
    {
      "code": 6001,
      "name": "NoBalance",
      "msg": "No LP tokens to burn for withdrawal."
    },
    {
      "code": 6002,
      "name": "WithdrawAmountTooLarge",
      "msg": "Withdraw amount is greater than callers LP token balance."
    },
    {
      "code": 6003,
      "name": "InsufficientSOLForTransfer",
      "msg": "Insufficient SOL for transaction."
    }
  ]
};
