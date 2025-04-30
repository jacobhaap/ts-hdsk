/**
 * @fileoverview Exports types for paths, input, and keys.
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

/** Derivation Path. */
export type Path = number[];

/** String or Byte Array input. */
export type Input = string | Uint8Array;

/** Hierarchical Deterministic key. */
export type HDKey = {
    key: Uint8Array, // Key
    code: Uint8Array, // Chain Code
    depth: number, // Depth in hierarchy
    path: string, // Derivation path
    fingerprint: Uint8Array // Fingerprint
}
