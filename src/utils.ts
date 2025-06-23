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

/** strToIndex obtains a 32 bit integer from a given hash and string. */
export function strToIndex(h: CHash, str: string): number {
    const sum = h.create().update(str).digest().slice(0, 4); // Create a hash of the string
    const buf = new DataView(new Uint8Array(sum).buffer); // Dataview of the hash digest
    return buf.getUint32(0, false); // Return 32 bit integer from the buffer
}

/** getIndex obtains a 32 bit integer index from a given hash, index string, and type. */
export function getIndex(h: CHash, index: string, type: string): number {
    if (!["num", "str", "any"].includes(type)) {
        throw new TypeError(`type "${type}" invalid for index`);
    }
    let i: number;
    if (type === "num") {
        try {
            const n = parseInt(index, 10); // Parse string to integer
            if (!Number.isInteger(n) || n < 0 || n > 0xFFFFFFFF) {
                throw new RangeError(`parsed index outside of uint32 range`)
            }
            i = n;
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
            const n = parseInt(index, 10); // Try parsing integer first
            if (!Number.isInteger(n) || n < 0 || n > 0xFFFFFFFF) {
                throw new RangeError(`parsed index outside of uint32 range`)
            }
            i = n;
        } catch {
            try {
                i = strToIndex(h, index); // Try string conversion next
            } catch (error) {
                throw new SyntaxError(`invalid index "${index}", ${error}`);
            }
        }
    }
    return i;
}

/** fingerprint calculates a fingerprint from a given hash, parent key, and child key. */
export function fingerprint(h: CHash, parent: Uint8Array, child: Uint8Array): Uint8Array {
    const mac = hmac.create(h, parent); // Create an HMAC using the parent
    mac.update(child); // Write the child to the MAC
    return mac.digest().slice(0, 16); // Return the MAC as the fingerprint
}
