/**
 * @fileoverview Entry point for @iacobus/hd.
 * Exports a 'SymmetricHD' class, providing an interface for hierarchical deterministic key
 * derivation, and parsing of derivation paths against path schemas.
 * @module
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

import type { Input, Path } from "./types.ts";
import { PathSchema } from "./path.ts";
import { type KeyInstance, type ChildKey, MasterKey, deriveHdKey } from "./hdKey.ts";
import { toBytes } from "./utils.ts";

/** Re-export of HDKey type. */
export type { HDKey } from "./types.ts";

/**
 * A class providing an interface for symmetric hierarchical deterministic keys.
 * @example
 * const hd = new SymmetricHD();
 */
export class SymmetricHD {
    /**
     * Validate and parse a derivation path schema from a string.
     * @example
     * const str: string = "m / application: any / purpose: any / context: any / index: num";
     * const schema = new SymmetricHD().schema(str);
     */
    schema(schema: string): PathSchema {
        // Return a new instance of a PathSchema
        return new PathSchema(schema);
    }
    /**
     * Derive a master key from a secret.
     * @example
     * const secret: string = "747261636B6572706C61747A";
     * const master = new SymmetricHD().master(secret);
     */
    master(secret: Input): MasterKey {
        // Return a new instance of a MasterKey
        return new MasterKey(toBytes(secret));
    }
    /**
     * Derive an HD key with a derivation path from an instance of a MasterKey or ChildKey.
     * @example
     * const path = schema.parse("m/42/0/1/0");
     * const hdKey = new SymmetricHD().derive(master, path);
     */
    derive(key: KeyInstance, path: Path): ChildKey {
        // Derive an HD key from a KeyInstance and derivation path
        // Derivation uses the KeyInstance as the root key "m"
        return deriveHdKey(key, path);
    }
}
