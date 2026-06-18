#!/usr/bin/env python3
"""Convert Anchor 1.0 IDL to Anchor 0.30-compatible format for @coral-xyz/anchor@0.32.1"""
import json, sys

idl = json.load(open(sys.argv[1]))

# Anchor 1.0 stores account type definitions in idl["types"] as a dict
# Anchor 0.30 expects inline type definitions in each account entry
types_map = {}
if isinstance(idl.get("types"), dict):
    types_map = idl["types"]
    del idl["types"]
elif isinstance(idl.get("types"), list):
    types_map = {t["name"]: t for t in idl["types"]}
    del idl["types"]

# Convert account entries: inline the type definition
if "accounts" in idl:
    for acct in idl["accounts"]:
        name = acct["name"]
        if name in types_map:
            type_def = types_map[name]
            # Anchor 0.30 expects: { name, discriminator, type: { kind, fields } }
            acct["type"] = {
                "kind": type_def["type"]["kind"],
                "fields": type_def["type"]["fields"]
            }
        # discriminator already present (Anchor 1.0 has inline discriminators)

# Convert instruction discriminator format if needed
# Anchor 1.0: { name, discriminator: [u8;8], accounts: [...], args: [...] }
# Anchor 0.30: same format - no conversion needed

# Metadata: change spec -> standard Anchor 0.30 version
if "metadata" in idl:
    idl["version"] = idl["metadata"]["version"]
    del idl["metadata"]

json.dump(idl, open(sys.argv[2], "w"), indent=2)
print(f"Converted: {sys.argv[1]} -> {sys.argv[2]}")
print(f"  accounts: {len(idl.get('accounts',[]))}, instructions: {len(idl.get('instructions',[]))}")
