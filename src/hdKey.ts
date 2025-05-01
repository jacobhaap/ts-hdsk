/**
 * @fileoverview Provides functionality for deriving Hierarchical Deterministic keys.
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

import {
    type HDKey, toBytes, strToIndex, encodeIndex,
    fingerprint, verifyFp, concatBytes, splitIkm, calcSalt
} from "./utils.ts";
import { hkdf } from "./hkdf.ts";

/** Abstract base class for HD Keys. */
abstract class Key {
    public key: HDKey; // Define public 'key' property as an HDKey
    // Constructor to define 'this.key'
    constructor(key: HDKey) {
        // Use the provided 'key' to define 'this.key'
        this.key = key;
    }
    /**
     * Derive a child key from the current key instance, at a chosen index.
     * @example
     * const child = parent.deriveChild(42);
     */
    deriveChild(index: number | string): ChildKey {
        let i: number; // Initialize 'i' for child derivation index
        if (typeof index === "number") {
            i = index; // When 'index' is a number, directly use for 'i'
        } else if (typeof index === "string") {
            i = strToIndex(index); // When 'index' is a string, convert to integer
        } else {
            // Throw an error when 'index' is not a number or a string
            throw new Error(`invalid index`);
        }
        // Return a new ChildKey at the selected index 'i'
        return new ChildKey(this.key, i);
    }
    /**
     * Check if a key instance is a direct child of a given parent key.
     * @example
     * const lineage = child.lineage(parent.key);
     */
    lineage(parent: HDKey): boolean {
        // Verify the key's fingerprint against a parent key
        return verifyFp(this.key, parent);
    }
}

/** Master key class that inherits Key for master key derivation. */
export class MasterKey extends Key {
    // Constructor to derive a master key
    constructor(secret: Uint8Array) {
        const salt = calcSalt(secret); // Derive a deterministic 'salt' from the secret
        const info = toBytes("symmetric_hd/master"); // Use domain-separated 'info'
        const ikm = hkdf(secret, salt, info, 64); // Blake2b-HKDF key from an IKM of 'secret'
        const [master, code] = splitIkm(ikm, [32, 32]); // Split 'ikm' into the master key and chain code
        const fp = fingerprint(secret, master); // Derive a fingerprint for the master key
        const path = "m"; // Define the derivation path
        const key = {
            key: master, // Master key
            code: code, // Chain code
            depth: 0, // Depth in hierarchy
            path: path, // Derivation path
            fingerprint: fp // Fingerprint
        }
        super(key); // Call constructor of Key with the master key
    }
}

/** Child key class that inherits Key for child key derivation. */
export class ChildKey extends Key {
    // Constructor to derive a child key
    constructor(parent: HDKey, index: number) {
        const salt = concatBytes(parent.key, encodeIndex(index)); // Use a salt of the parent key + index
        const info = toBytes("symmetric_hd/child"); // Use domain-separated 'info'
        const ikm = hkdf(parent.code, salt, info, 64); // Blake2b-HKDF key from an IKM of the parent chain code
        const [child, code] = splitIkm(ikm, [32, 32]); // Split 'ikm' into the child key and chain code
        const fp = fingerprint(parent.key, child); // Derive a fingerprint for the child key
        const path = parent.path + "/" + index.toString(); // Define the derivation path
        const key = {
            key: child, // Child key
            code: code, // Chain code
            depth: parent.depth + 1, // Depth in hierarchy
            path: path, // Derivation path
            fingerprint: fp // Fingerprint
        }
        super(key); // Call constructor of Key with the child key
    }
}

/** An instance of a MasterKey or ChildKey. */
export type KeyInstance = MasterKey | ChildKey;

/** Derive an HD key from a parent key and derivation path. */
export function deriveHdKey(parent: MasterKey | ChildKey, path: number[]): ChildKey {
    let key = parent.deriveChild(path[0]); // Initialize 'key' with first index from the path
    // Iterate over indices of the derivation path
    for (let i = 1; i < path.length; i++) {
        const index = path[i]; // Get the current index
        key = key.deriveChild(index); // Derive a child key from 'key' for the current index
    }
    return key; // Return the HD key
}
