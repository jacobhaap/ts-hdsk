/**
 * @fileoverview Exports utility functions.
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

import type { Input, HDKey } from "./types.ts";
import { hexToBytes } from "npm:@noble/hashes@1.7.2/utils";
import { blake2b } from "npm:@noble/hashes@1.7.2/blake2b";
import { hkdf } from "./hkdf.ts";

/** TextEncoder instance. */
const encoder = new TextEncoder();

/** Checks if a string is hexadecimal, returning a boolean value. */
function isHex(str: string): boolean {
    return str.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(str);
}

/** Convert a UTF-8 encoded string to a Uint8Array. */
function utf8ToBytes(str: string): Uint8Array {
    return new Uint8Array(encoder.encode(str));
}

/** Convert a string (UTF-8 or Hex) to a Uint8Array. */
function strToBytes(str: string): Uint8Array {
    // Check if the string is hex encoded
    if (isHex(str))  {
        // Convert hex string to bytes
        return hexToBytes(str);
    }
    // If not hex encoded, convert UTF-8 to bytes
    return utf8ToBytes(str);
}

/**
 * Returns a Uint8Array from {@link Input}. When the input is a string,
 * it is handled as either hex encoded or UTF-8 encoded.
 */
export function toBytes(input: Input): Uint8Array {
    if (typeof input === "string") {
        return strToBytes(input); // Convert to bytes, when 'input' is a string
    } else if (input instanceof Uint8Array) {
        return input; // Return 'input' when already bytes (Uint8Array).
    } else {
        throw new Error(`invalid byte conversion`);
    }
}

/** Calculate a domain-separated salt for a secret. */
export function calcSalt(secret: Uint8Array): Uint8Array {
    const label = toBytes("symmetric_hd/salt"); // Domain-separated label
    const mac = blake2b(secret, { key: label, dkLen: 16 }); // Blake2b MAC with a message 'secret' and key of 'label'
    const bytes = new Uint8Array(label.length + mac.length); // Allocate Uint8Array for 'label' + 'mac'
    bytes.set(label, 0); // Insert 'label' at the beginning
    bytes.set(mac, label.length); // Insert 'mac' at the end
    return bytes; // Return bytes of 'label' + 'mac'
}

/** Check if a string numeric. */
function isNumber(str: string): boolean {
    return /^\d+$/.test(str);
}

/** Check if a string is alphabetic. */
function isString(str: string): boolean {
    return /^[a-zA-Z\-]+$/.test(str);
}

/** Obtain an index number in the range 0 to 2^31 - 1 from a string. */
export function strToIndex(str: string): number {
    const hash = blake2b(str, { dkLen: 32 }); // Take a blake2b hash of the string
    const buf = new DataView(new Uint8Array(hash).buffer); // Dataview of the hash digest
    const value = buf.getUint32(0, false); // Get a 32 bit integer from the buffer
    return value % 0x80000000; // Return index number in the defined range
}

/** Check if an index number is in the range 0 to 2^31 - 1. */
function isValidIndex(i: number): boolean {
    return Number.isInteger(i) && i >= 0 && i <= 0x7FFFFFFF;
}

/** Get an index number from a string, with type enforcement. */
export function getIndex(index: string, type: string): number {
    if (!["num", "str", "any"].includes(type)) {
        // Throw an error if the type is invalid
        throw new Error(`invalid type, "${type}"`);
    }
    let i: number;
    if (type === "num") {
        if (!isNumber(index)) {
            // Throw an error if the type is 'num' and 'index' is an invalid numeric string
            throw new Error(`invalid number index, "${index}"`);
        }
        i = parseInt(index); // Convert string number to an integer
    } else if (type === "str") {
        if (!isString(index)) {
            // Throw an error if the type is 'str' and 'index' is an invalid alphabetic string
            throw new Error(`invalid string index, "${index}"`);
        }
        i = strToIndex(index); // Convert alphabetic string to an index with 'strToIndex'
    } else {
        i = isNumber(index) // First, check if the index is a numeric string
            ? parseInt(index) // Convert to integer
            : isString(index) // Second, check if the index is an alphabetic string
            ? strToIndex(index) // Convert to numeric index
            // If both 'num' and 'str' conditions failed, throw an error
            : (() => { throw new Error(`invalid index, "${index}"`); })();
    }
    if (isValidIndex(i)) {
        return i; // Return if the index 'i' is in range
    } else {
        // Throw an error when the index is out of range
        throw new Error(`out of range index, "${i}"`);
    }
}

/** Encode a 32 bit integer index number as a 4 byte Uint8Array. */
export function encodeIndex(i: number): Uint8Array {
    const buf = new Uint8Array(4);
    buf[0] = (i >>> 24) & 0xff;
    buf[1] = (i >>> 16) & 0xff;
    buf[2] = (i >>> 8) & 0xff;
    buf[3] = i & 0xff;
    return buf;
}

/** Calculate a fingerprint from a parent key and child key. */
export function fingerprint(parent: Uint8Array, child: Uint8Array): Uint8Array {
    const salt = calcSalt(parent); // Derive a deterministic 'salt' from the parent key
    const info = toBytes("symmetric_hd/fingerprint") // Use domain-separated label as the 'info'
    const key = hkdf(parent, salt, info, 32); // Blake2b-HKDF key from an IKM of 'parent'
    return blake2b(child, { key: key, dkLen: 16 }); // Return blake2b MAC with a message 'child' and key of 'key'
}

/** Verify a child key's fingerprint against a parent key. */
export function verifyFp(child: HDKey, parent: HDKey): boolean {
    const fp1 = child.fingerprint; // Extract the child fingerprint as 'fp1'
    const fp2 = fingerprint(parent.key, child.key); // Derive 'fp2' from the parent and child keys
    // Complete a constant-time comparison between the 16 bytes of each fingerprint
    let result = 0;
    for (let i = 0; i < 16; i++) {
        result |= fp1[i] ^ fp2[i];
    }
    return result === 0; // Return a boolean result of the byte comparison
}

/** Concatenate two Uint8Arrays, in the order they are received. */
export function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.length + b.length); // Allocate Uint8Array for a + b
    result.set(a, 0); // Insert 'a' at the beginning 
    result.set(b, a.length); // Insert 'b' at the end
    return result; // Return concatenated bytes
}

/** Split input key material into an array of Uint8Arrays, based on an array of sizes. */
export function splitIkm(bytes: Uint8Array, size: number[]): Uint8Array[] {
    const result: Uint8Array[] = []; // Initialize result array for the split ikm
    let offset = 0; // Start at index 0 in 'bytes'
    // Iterate over the byte lengths in 'size'
    for (const len of size) {
        result.push(bytes.slice(offset, offset + len)); // Extract 'len' bytes starting at the offset
        offset += len; // Increment the offset by 'len'
    }
    return result; // Return the split ikm
}
