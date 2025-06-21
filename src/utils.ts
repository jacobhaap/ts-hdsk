/**
 * @fileoverview Exports utility functions.
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

import type { CHash } from "npm:@noble/hashes@1.8.0/utils";
import { hmac } from "npm:@noble/hashes@1.8.0/hmac";

/** calcSalt creates a 16 byte salt from a given hash, message, and optional context info. */
export function calcSalt(h: CHash, msg: Uint8Array, info?: Uint8Array,): Uint8Array {
    if (info) {
        const hash = h.create().update(info); // Hash to expand the info
        info = hash.digest().slice(0, 16); // Expanded info from hash digest
    } else {
        info = new Uint8Array(16); // 16 byte array
    }
    const mac = hmac.create(h, info); // Create HMAC using info
    mac.update(msg);
    const domain = Uint8Array.from([83, 65, 76, 84]); // Bytes SALT for domain separation
    mac.update(domain);
    return mac.digest().slice(0, 16); // Return a salt from the MAC digest
}

/** encodeInt encodes a given integer as a 4 byte Uint8Array. */
export function encodeInt(int: number): Uint8Array {
    const buf = new Uint8Array(4);
    buf[0] = (int >>> 24) & 0xff;
    buf[1] = (int >>> 16) & 0xff;
    buf[2] = (int >>> 8) & 0xff;
    buf[3] = int & 0xff;
    return buf;
}

/** strToIndex obtains an integer in the range 0 to 2^31 - 1 from a given hash and string. */
export function strToIndex(h: CHash, str: string): number {
    const sum = h.create().update(str).digest(); // Create a hash of the string
    const buf = new DataView(new Uint8Array(sum).buffer); // Dataview of the hash digest
    const value = buf.getUint32(0, false); // Get a 32 bit integer from the buffer
    return value % 0x80000000; // Return integer in the defined range
}

/** isValidIndex checks if a given index is in the range 0 to 2^31 - 1. */
function isValidIndex(i: number): boolean {
    return Number.isInteger(i) && i >= 0 && i <= 0x7FFFFFFF;
}

/** getIndex obtains an in-range integer index from a given hash, index string, and type. */
export function getIndex(h: CHash, index: string, type: string): number {
    if (!["num", "str", "any"].includes(type)) {
        throw new TypeError(`type "${type}" invalid for index`);
    }
    let i: number;
    if (type === "num") {
        try {
            i = parseInt(index); // Parse string to integer
        } catch (error) {
            throw new TypeError(`invalid numeric index "${index}", ${error}`);
        }
    } else if (type === "str") {
        try {
            i = strToIndex(h, index); // Convert string to an integer
        } catch (error) {
            throw new TypeError(`invalid alphabetic index "${index}", ${error}`);
        }
    } else {
        try {
            i = parseInt(index); // Try parsing integer first
        } catch {
            try {
                i = strToIndex(h, index); // Try string conversion next
            } catch (error) {
                throw new SyntaxError(`invalid index "${index}", ${error}`);
            }
        }
    }
    if (isValidIndex(i)) {
        return i; // Return if i is in range
    } else {
        throw new RangeError(`out of range index "${i}"`);
    }
}

/** fingerprint calculates a fingerprint from a given hash, parent key, and child key. */
export function fingerprint(h: CHash, parent: Uint8Array, child: Uint8Array): Uint8Array {
    const mac = hmac.create(h, parent); // Create an HMAC using the parent
    mac.update(child); // Write the child to the MAC
    return mac.digest().slice(0, 16); // Return the MAC as the fingerprint
}
