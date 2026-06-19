/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/flappy_bull.json`.
 */
export type FlappyBull = {
  "address": "4pRUMdU5Ha9G2MSriNM5NqhwhYo6Mvuq827FVMBTjHzm",
  "instructions": [
    {
      "name": "delegate",
      "docs": [
        "Delegate the GameSession PDA to the ER (existing pattern).",
        "",
        "`player` is a plain arg (the relayer is `payer`). See `start_run` note on",
        "the trust trade-off."
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
          "name": "buffer_game_session",
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
                "path": "game_session"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                56,
                185,
                7,
                107,
                191,
                9,
                110,
                77,
                150,
                133,
                217,
                230,
                192,
                152,
                236,
                157,
                17,
                107,
                99,
                237,
                150,
                17,
                186,
                200,
                176,
                102,
                95,
                148,
                47,
                40,
                94,
                198
              ]
            }
          }
        },
        {
          "name": "delegation_record_game_session",
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
                "path": "game_session"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegation_program"
            }
          }
        },
        {
          "name": "delegation_metadata_game_session",
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
                "path": "game_session"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegation_program"
            }
          }
        },
        {
          "name": "game_session",
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
                "kind": "arg",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "owner_program",
          "address": "4pRUMdU5Ha9G2MSriNM5NqhwhYo6Mvuq827FVMBTjHzm"
        },
        {
          "name": "delegation_program",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "player",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "finish_run",
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
          "name": "game_session",
          "docs": [
            "Anchor re-serializing after commit_and_undelegate reassigns ownership.",
            "The PDA is verified against its recorded player in the handler."
          ],
          "writable": true
        },
        {
          "name": "magic_program",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magic_context",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "init_leaderboard",
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
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "init_room",
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
          "name": "season_params",
          "writable": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "room_id",
          "type": "u8"
        },
        {
          "name": "config",
          "type": {
            "defined": {
              "name": "SeasonConfig"
            }
          }
        }
      ]
    },
    {
      "name": "init_season",
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
          "name": "season_params",
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
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "process_undelegation",
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
          "name": "base_account",
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
          "name": "system_program"
        }
      ],
      "args": [
        {
          "name": "account_seeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "start_run",
      "docs": [
        "Player creates/resets a GameSession with a fresh sim state.",
        "",
        "Trust trade-off: `player` is a plain arg (not a signer). The relayer",
        "pays/broadcasts this tx, so anyone can call it on-chain directly (e.g.",
        "reset a session). Authorization lives off-chain in the Worker's",
        "`signMessage` check — this intentionally regresses trustless scoring for",
        "gasless onboarding. Scores stay sim-honest regardless (`submit_taps`",
        "recomputes via `step()`; `update_leaderboard` enforces `score <= tick`)."
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
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "game_session",
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
                "kind": "arg",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "season_params"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "player",
          "type": "pubkey"
        },
        {
          "name": "session_key",
          "type": "pubkey"
        },
        {
          "name": "room_id",
          "type": "u8"
        }
      ]
    },
    {
      "name": "submit_taps",
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
          "name": "game_session",
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
                "account": "GameSession"
              }
            ]
          }
        },
        {
          "name": "season_params"
        }
      ],
      "args": [
        {
          "name": "start_tick",
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
      "name": "update_leaderboard",
      "docs": [
        "Base-layer instruction: verify finished run and insert into leaderboard.",
        "",
        "Relayer is `payer`; the session PDA is derived from the stored",
        "`game_session.player`, not a signer. See `start_run` note on the trust",
        "trade-off — the on-chain `score <= tick` + `!settled` guards still hold."
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
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "game_session",
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
                "account": "GameSession"
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
      "name": "GameSession",
      "discriminator": [
        150,
        116,
        20,
        197,
        205,
        121,
        220,
        240
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "session_key",
            "type": "pubkey"
          },
          {
            "name": "room_id",
            "type": "u8"
          },
          {
            "name": "start_slot",
            "type": "u64"
          },
          {
            "name": "tap_count",
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
            "name": "sim_state",
            "type": {
              "defined": {
                "name": "SimState"
              }
            }
          }
        ]
      }
    },
    {
      "name": "Leaderboard",
      "discriminator": [
        247,
        186,
        238,
        243,
        194,
        30,
        9,
        36
      ],
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
      "name": "SeasonParams",
      "discriminator": [
        77,
        88,
        56,
        124,
        184,
        182,
        53,
        155
      ],
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
                "name": "SeasonConfig"
              }
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Only the session key may submit taps"
    },
    {
      "code": 6001,
      "name": "OutOfOrder",
      "msg": "Input tick must equal the current sim tick (strict-nonce ordering)"
    },
    {
      "code": 6002,
      "name": "BullDead",
      "msg": "Bull is already dead"
    },
    {
      "code": 6003,
      "name": "RunNotFinished",
      "msg": "Run must be finished (bull dead) before updating leaderboard"
    },
    {
      "code": 6004,
      "name": "AlreadySettled",
      "msg": "This run has already been settled"
    },
    {
      "code": 6005,
      "name": "NoTapsSubmitted",
      "msg": "Must submit at least one tap"
    },
    {
      "code": 6006,
      "name": "ScoreExceedsTick",
      "msg": "Score cannot exceed tick count"
    },
    {
      "code": 6007,
      "name": "BadBatch",
      "msg": "Batch must be non-empty with matching tap and price lengths"
    }
  ],
  "version": "0.1.0"
};
