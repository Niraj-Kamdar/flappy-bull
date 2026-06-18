/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/flappy_bull.json`.
 */
export type FlappyBull = {
  "address": "4pRUMdU5Ha9G2MSriNM5NqhwhYo6Mvuq827FVMBTjHzm",
  "metadata": {
    "name": "flappyBull",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Flappy Bull game session program"
  },
  "instructions": [
    {
      "name": "delegate",
      "docs": [
        "Delegate the GameSession PDA to the ER (existing pattern)."
      ],
      "discriminator": [
        90,
        147,
        75,
        178,
        85,
        88,
        4,
        137
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "bufferGameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "gameSession"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                63,
                230,
                25,
                136,
                229,
                147,
                122,
                103,
                88,
                194,
                105,
                67,
                244,
                236,
                54,
                230,
                239,
                6,
                254,
                207,
                190,
                66,
                132,
                79,
                231,
                247,
                210,
                148,
                233,
                1,
                112,
                31
              ]
            }
          }
        },
        {
          "name": "delegationRecordGameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "gameSession"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataGameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "gameSession"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "ownerProgram",
          "address": "4pRUMdU5Ha9G2MSriNM5NqhwhYo6Mvuq827FVMBTjHzm"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "finishRun",
      "docs": [
        "ER instruction: commit the current sim state + undelegate, freeing the PDA.",
        "",
        "Commits the *real* applied state as-is — no forward-sim guess. Whatever",
        "ticks the client streamed (via submit_taps) is what gets committed:",
        "- happy path: the client drains the whole input stream (incl. the fatal",
        "tick) before calling this, so the committed score == client death tick,",
        "- forfeit (crash/abandon while still alive): commits the true partial",
        "score rather than a fabricated death, and still undelegates so the PDA",
        "never locks.",
        "",
        "No `require!(!alive)` guard: an alive session must still be finalizable or",
        "its PDA locks forever. We mark it not-alive here so it can settle."
      ],
      "discriminator": [
        125,
        146,
        243,
        213,
        56,
        220,
        214,
        25
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameSession",
          "docs": [
            "Anchor re-serializing after commit_and_undelegate reassigns ownership.",
            "The PDA is verified against its recorded player in the handler."
          ],
          "writable": true
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initLeaderboard",
      "docs": [
        "Admin: create the Leaderboard PDA (empty top-10)."
      ],
      "discriminator": [
        70,
        179,
        5,
        151,
        152,
        16,
        47,
        15
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "leaderboard",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  98
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initRoom",
      "docs": [
        "Admin: create or update a per-room SeasonParams PDA."
      ],
      "discriminator": [
        166,
        102,
        103,
        49,
        179,
        136,
        136,
        113
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "seasonParams",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roomId",
          "type": "u8"
        },
        {
          "name": "config",
          "type": {
            "defined": {
              "name": "seasonConfig"
            }
          }
        }
      ]
    },
    {
      "name": "initSeason",
      "docs": [
        "Admin: create the SeasonParams PDA with default physics."
      ],
      "discriminator": [
        179,
        47,
        101,
        197,
        114,
        97,
        174,
        98
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "seasonParams",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  97,
                  115,
                  111,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "startRun",
      "docs": [
        "Player creates/resets a GameSession with a fresh sim state."
      ],
      "discriminator": [
        72,
        212,
        1,
        91,
        61,
        186,
        2,
        52
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "seasonParams"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "sessionKey",
          "type": "pubkey"
        },
        {
          "name": "roomId",
          "type": "u8"
        }
      ]
    },
    {
      "name": "submitTaps",
      "docs": [
        "ER instruction: advance sim_state by a batch of ticks.",
        "",
        "Batch-streamed application: a batch covers ticks `[start_tick ..",
        "start_tick + taps.len())`, each frame carrying its tap and tap-time",
        "price. The consumer (one tx = one tick) is structurally slower than the",
        "60–120 fps producer; bundling many ticks per tx lets throughput keep up.",
        "",
        "Ordering is idempotent and gap-rejecting:",
        "- a fully-consumed batch (`end <= cur`) is a no-op (reorder/retransmit safe),",
        "- a batch that would skip a tick (`start_tick > cur`) rejects (`OutOfOrder`),",
        "so the client re-sends starting at the current sim tick,",
        "- otherwise only the unapplied suffix is applied, strictly in order.",
        "",
        "Each input carries its tap-time price, so network lag delays the input",
        "and its price together — they stay aligned regardless of when the tx",
        "lands. The client `step()` and this `step()` are bit-identical, so the",
        "committed trajectory matches the client's."
      ],
      "discriminator": [
        136,
        226,
        222,
        173,
        237,
        63,
        94,
        102
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "game_session.player",
                "account": "gameSession"
              }
            ]
          }
        },
        {
          "name": "seasonParams"
        }
      ],
      "args": [
        {
          "name": "startTick",
          "type": "u32"
        },
        {
          "name": "taps",
          "type": {
            "vec": "bool"
          }
        },
        {
          "name": "prices",
          "type": {
            "vec": "i64"
          }
        }
      ]
    },
    {
      "name": "updateLeaderboard",
      "docs": [
        "Base-layer instruction: verify finished run and insert into leaderboard."
      ],
      "discriminator": [
        72,
        95,
        102,
        32,
        118,
        158,
        247,
        34
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "leaderboard",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  98
                ]
              }
            ]
          }
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "gameSession",
      "discriminator": [
        150,
        116,
        20,
        197,
        205,
        121,
        220,
        240
      ]
    },
    {
      "name": "leaderboard",
      "discriminator": [
        247,
        186,
        238,
        243,
        194,
        30,
        9,
        36
      ]
    },
    {
      "name": "seasonParams",
      "discriminator": [
        77,
        88,
        56,
        124,
        184,
        182,
        53,
        155
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Only the session key may submit taps"
    },
    {
      "code": 6001,
      "name": "outOfOrder",
      "msg": "Input tick must equal the current sim tick (strict-nonce ordering)"
    },
    {
      "code": 6002,
      "name": "bullDead",
      "msg": "Bull is already dead"
    },
    {
      "code": 6003,
      "name": "runNotFinished",
      "msg": "Run must be finished (bull dead) before updating leaderboard"
    },
    {
      "code": 6004,
      "name": "alreadySettled",
      "msg": "This run has already been settled"
    },
    {
      "code": 6005,
      "name": "noTapsSubmitted",
      "msg": "Must submit at least one tap"
    },
    {
      "code": 6006,
      "name": "scoreExceedsTick",
      "msg": "Score cannot exceed tick count"
    },
    {
      "code": 6007,
      "name": "badBatch",
      "msg": "Batch must be non-empty with matching tap and price lengths"
    }
  ],
  "types": [
    {
      "name": "gameSession",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "sessionKey",
            "type": "pubkey"
          },
          {
            "name": "roomId",
            "type": "u8"
          },
          {
            "name": "startSlot",
            "type": "u64"
          },
          {
            "name": "tapCount",
            "type": "u32"
          },
          {
            "name": "alive",
            "type": "bool"
          },
          {
            "name": "settled",
            "type": "bool"
          },
          {
            "name": "simState",
            "type": {
              "defined": {
                "name": "simState"
              }
            }
          }
        ]
      }
    },
    {
      "name": "leaderboard",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "players",
            "type": {
              "array": [
                "pubkey",
                10
              ]
            }
          },
          {
            "name": "scores",
            "type": {
              "array": [
                "u32",
                10
              ]
            }
          },
          {
            "name": "count",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "seasonConfig",
      "docs": [
        "Physics config — mirrors sim_core::SeasonConfig field-for-field."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gravity",
            "type": "i32"
          },
          {
            "name": "tapBoost",
            "type": "i32"
          },
          {
            "name": "maxUpVel",
            "type": "i32"
          },
          {
            "name": "maxVelY",
            "type": "i32"
          },
          {
            "name": "scale",
            "type": "i32"
          },
          {
            "name": "canvasHPx",
            "type": "i32"
          },
          {
            "name": "bullRadiusPx",
            "type": "i32"
          },
          {
            "name": "channelHalfMin",
            "type": "i32"
          },
          {
            "name": "lerpNumBase",
            "type": "i32"
          },
          {
            "name": "lerpDen",
            "type": "i32"
          },
          {
            "name": "lerpNumFast",
            "type": "i32"
          },
          {
            "name": "canvasWPx",
            "type": "i32"
          },
          {
            "name": "bullXPx",
            "type": "i32"
          },
          {
            "name": "pipeWidthPx",
            "type": "i32"
          },
          {
            "name": "pipeScroll",
            "type": "i32"
          },
          {
            "name": "pipeSpacingPx",
            "type": "i32"
          },
          {
            "name": "priceVelFastThresh",
            "type": "i64"
          },
          {
            "name": "priceFracScale",
            "type": "i64"
          },
          {
            "name": "season",
            "type": "u8"
          },
          {
            "name": "pad",
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "seasonParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "physics",
            "type": {
              "defined": {
                "name": "seasonConfig"
              }
            }
          }
        ]
      }
    },
    {
      "name": "simState",
      "docs": [
        "Fixed-point sim state — mirrors sim_core::SimState field-for-field."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bullY",
            "type": "i32"
          },
          {
            "name": "velY",
            "type": "i32"
          },
          {
            "name": "channelCenter",
            "type": "i32"
          },
          {
            "name": "tick",
            "type": "u32"
          },
          {
            "name": "score",
            "type": "u32"
          },
          {
            "name": "price",
            "type": "i64"
          },
          {
            "name": "flags",
            "type": "u32"
          },
          {
            "name": "pipeX",
            "type": {
              "array": [
                "i32",
                4
              ]
            }
          },
          {
            "name": "pipeGap",
            "type": {
              "array": [
                "i32",
                4
              ]
            }
          }
        ]
      }
    }
  ]
};
