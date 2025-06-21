/**
 * @fileoverview Test script for the exports of the @iacobus/hd entry point.
 * Completes a vectored test for HD symmetric key derivation.
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

import { sha256 } from "npm:@noble/hashes@1.8.0/sha2";
import { bytesToHex } from "npm:@noble/hashes@1.8.0/utils";
import { assert } from "jsr:@std/assert@1.0.13";
import { Hdsk } from "../src/mod.ts";

/** Vector is an object for a test vector. */
type Vector = {
    path: string,
    key: string
}

/** vectors are HDSK test vectors. */
const vectors: Vector[] = [
    {
        "path": "m/42/0/1/0",
        "key": "7bc626147a8441fd808a42dbfb889a083f1cbd3065b5921e1a28a53db0d3781f"
    },
    {
        "path": "m/42/0/1/1",
        "key": "4b5fdd55957768e3c3fde5e610a22da99f12a408f4dcbb570ddb61cf5d33e08c"
    },
    {
        "path": "m/42/0/1/2",
        "key": "4643a704151cdf68684ac0d9be1fbbba5911696067204291fc5ac56566b49c80"
    },
    {
        "path": "m/42/0/1/3",
        "key": "bb9fc738a31b8b01c74e3fc95a567ad6f3d6c194c1c79b35a626bb3adb388a1f"
    },
    {
        "path": "m/42/0/1/4",
        "key": "0d2128c047ed6af3dd6d2e08174e6dd38711d35640bcd0fccf8bd269e6a27451"
    },
    {
        "path": "m/42/0/1/5",
        "key": "d62d3d6c6a02894437c4d3053a2057c409abfc8e4d56b0406509d896f3b12636"
    },
    {
        "path": "m/42/0/1/6",
        "key": "2e66f3d55aee7fcc0887b5d217419f2abc5b6f3313186cc61840002b2136aeba"
    },
    {
        "path": "m/42/0/1/7",
        "key": "570481958950191a99f5e155d69f30949f6fccebd748488dcb57c04ef8a56d9d"
    },
    {
        "path": "m/42/0/1/8",
        "key": "227643310206555c76dc746e4b199297294eeb61b005df87af9cee98a2a8f1e2"
    },
    {
        "path": "m/42/0/1/9",
        "key": "cc80f4247d3eae7ebfb0cbc2aaf9fac0c59c4b9de3893b737c6c2091cb48b9c6"
    },
    {
        "path": "m/42/0/1/10",
        "key": "3806560559a126103816cfbc5adf303bbca73e0e6b0be6bc8e993728ee3b4201"
    },
    {
        "path": "m/42/0/1/11",
        "key": "d0fbb1a48c618e6c821679933cc82975c9a4b1b92f0e232f16718f2339aee946"
    },
    {
        "path": "m/42/0/1/12",
        "key": "5a7956f7d8f5a70abe93ea9f8c232e2839fd9d55d8acab14f18aa1818394ab81"
    },
    {
        "path": "m/42/0/1/13",
        "key": "7188a0fb873e15b1f3259d4508c601bea6b638c80974c66676acfadb378cacca"
    },
    {
        "path": "m/42/0/1/14",
        "key": "7d418c8fdb420857e5b67b04729a6e65b3fc5ed4f719f5a8f1a97fc43a098ab6"
    },
    {
        "path": "m/42/0/1/15",
        "key": "7bcd50cf2e8eb0412910b804aebb5ac2b6f0fd2436a6cfc0b5a9bd20e97d1f84"
    }
]

// Test for HDSK
Deno.test(`Hdsk derives HD keys`, () => {
    const hd = new Hdsk(); // New instance of Hdsk
    const h = sha256; // Use sha256 as the hash function
    const str: string = "m / application: any / purpose: any / context: any / index: num";
    const schema = hd.schema(str); // Parse the schema
    const secret = new Uint8Array(32) // Create a secret of 32 zero bytes
    const master = hd.master(h, secret); // Derive a master key from the hash and secret
    for (const {path, key} of vectors) {
        const dp = schema.parse(h, path); // Parse the vector derivation path
        const node = master.node(dp); // Derive a new node from the master key using the path
        const hex = bytesToHex(node.key.key); // Encode the embedded key as hex
        assert(hex === key, `mismatch for ${path}: expected "${key}", got "${hex}"`);
        const child = node.child(42); // Derive a child of the node at index 42
        const lineage = child.lineage(node.key); // Verify the lineage of the child
        assert(lineage === true, `invalid key lineage encountered for child of "${hex}"`);
    }
});
