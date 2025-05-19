/**
 * @fileoverview Provides an implementation of Blake2b-HKDF.
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

import { blake2b } from "npm:@noble/hashes@1.7.2/blake2b";
import { concatBytes } from "./utils.ts";

/** mac_digest is a blake2b MAC digest for HKDF implementation. */
function mac_digest(key: Uint8Array, data: Uint8Array): Uint8Array {
    return blake2b(data, { key: key, dkLen: 64 }); // Blake2b with a 'key' for MAC mode
}

/**
 * hkdf_extract takes an IKM and optional salt to generate a cryptographic key.
 * Returns a {@link mac_digest} with the salt as the key and the IKM as the message.
 */
function hkdf_extract(ikm: Uint8Array, salt?: Uint8Array): Uint8Array {
    if (salt === undefined) {
        salt = new Uint8Array(blake2b.outputLen); // Use zero bytes when 'salt' is undefined
    }
    return mac_digest(salt, ikm); // Return mac_digest of 'salt' and 'ikm'
}

/**
 * hkdf_expand takes a PRK, 'info', and a length to generate output of a desired length (default 32 bytes).
 * Repeatedly calls {@link mac_digest} using the PRK as the key and 'info' as the message.
 */
function hkdf_expand(prk: Uint8Array, info?: Uint8Array, length: number = 32): Uint8Array {
    let t: Uint8Array = new Uint8Array(0); // Last block
    let okm: Uint8Array = new Uint8Array(0); // Output Key Material
    let i = 0; // Counter (index)
    if (info === undefined) {
        info = new Uint8Array(0); // Use empty uint8Array when 'info' is undefined
    }
    while (okm.length < length) {
        i ++; // Increment counter
        const input = new Uint8Array(t.length + info.length + 1); // Allocate Uint8Array for 't' + 'info' + 'i'
        input.set(t, 0); // Insert 't' at the beginning 
        input.set(info, t.length); // Insert 'info' after 't'
        input.set([i], t.length + info.length); // Insert counter 'i' at the end
        t = mac_digest(prk, input); // MAC with 'prk' key and 'input' message
        okm = concatBytes(okm, t); // Set the output key material to 'okm' + 't'
    }
    return okm.slice(0, length); // Return 'okm' at the requested byte length
}

/**
 * hkdf is an implementation of HKDF using a Blake2b MAC.
 * Derives a key from an initial keying material across extract + expand steps.
 */
export function hkdf(ikm: Uint8Array, salt: Uint8Array | undefined, info: Uint8Array | undefined, length?: number): Uint8Array {
    const prk = hkdf_extract(ikm, salt as Uint8Array | undefined); // Obtain 'prk' from 'hkdf_extract' step
    return hkdf_expand(prk, info as Uint8Array | undefined, length); // Return result of 'hkdf_expand' step
}
