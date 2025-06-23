/**
 * @fileoverview Provides functionality for deriving hierarchical deterministic symmetric keys.
 * @module
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

import type { CHash } from "npm:@noble/hashes@1.8.0/utils";
import type { HDPath } from "./path.ts";
import { hkdf } from "npm:@noble/hashes@1.8.0/hkdf";
import { fingerprint, calcSalt, encodeInt } from "./utils.ts";

/** HDKey holds a Hierarchical Deterministic Key. */
export type HDKey = {
    /** Cryptographic key. */
    key: Uint8Array,
    /** Chain code. */
    code: Uint8Array,
    /** Depth in hierarchy. */
    depth: number,
    /** Key fingerprint. */
    fingerprint: Uint8Array
}

/**
 * deriveMaster derives a new master key from a given hash and secret.
 * @example
 * const master = deriveMaster(h, secret);
 */
export function deriveMaster(h: CHash, secret: Uint8Array): HDKey {
    const salt = calcSalt(h, secret); // Derive salt from the secret
    const ikm = hkdf(h, secret, salt, "MASTER", 64); // Derive ikm from bytes
    const master = ikm.slice(0, 32) // First 32 bytes as the key
    const code = ikm.slice(32, 64) // Last 32 bytes as the chain code
    const fp = fingerprint(h, secret, master); // Derive a fingerprint for the master key
    return {
        key: master,
        code: code,
        depth: 0,
        fingerprint: fp
    }
}

/**
 * deriveChild derives a new child key from a given hash, master key, and index.
 * @example
 * const child = deriveChild(h, master, 42);
 */
export function deriveChild(h: CHash, master: HDKey, index: number): HDKey {
    index = index >>> 0; // Emulate 32 bit integer
    const info1 = encodeInt(index); // Context info from encoded index
    const salt = calcSalt(h, master.code, info1); // Derive salt from the master code
    const info2 = "CHILD" + index.toString(); // Construct info for HKDF form CHILD + index string
    const ikm = hkdf(h, master.code, salt, info2, 64); // Derive ikm from master chain code
    const child = ikm.slice(0, 32) // First 32 bytes as the key
    const code = ikm.slice(32, 64) // Last 32 bytes as the chain code
    const fp = fingerprint(h, master.key, child); // Derive a fingerprint for the child key
    return {
        key: child,
        code: code,
        depth: master.depth + 1,
        fingerprint: fp
    }
}

/**
 * deriveNode derives a new key at a node in a hierarchy descending from a master key, from
 * a given hash, master key, and derivation path.
 * @example
 * const node = deriveNode(h, master, path);
 */
export function deriveNode(h: CHash, master: HDKey, path: HDPath): HDKey {
    let key = deriveChild(h, master, path[0]); // Initialize key with first index from the path
    for (let i = 1; i < path.length; i++) {
        const index = path[i]; // Get the current index
        key = deriveChild(h, key, index); // Derive a child of key for the current index
    }
    return key;
}

/**
 * lineage checks if a key is the direct child of a master key, from a given hash,
 * child key, and master key.
 * @example
 * const related = lineage(h, child, master);
 */
export function lineage(h: CHash, child: HDKey, master: HDKey): boolean {
    const fp1 = child.fingerprint; // Extract the child fingerprint as fp1
    const fp2 = fingerprint(h, master.key, child.key); // Derive fp2 from the master and child keys
    if (fp1.length !== 16 || fp2.length !== 16) {
        throw new RangeError(`fingerprints for lineage verification must be 16 bytes each`)
    }
    // Complete a constant-time comparison between the 16 bytes of each fingerprint
    let result = 0;
    for (let i = 0; i < 16; i++) {
        result |= fp1[i] ^ fp2[i];
    }
    return result === 0; // Return a boolean result of the byte comparison
}
