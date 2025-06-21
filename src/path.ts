/**
 * @fileoverview Provides functionality for parsing derivation paths and schemas.
 * @module
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

import type { CHash } from "npm:@noble/hashes@1.8.0/utils";
import { getIndex } from "./utils.ts";

/** HDSchema is a derivation path schema. */
export type HDSchema = [string, string][];

/** HDPath is a derivation path. */
export type HDPath = number[];

/**
 * newSchema parses a new derivation path schema from a given string.
 * @example
 * const str: string = "m / application: any / purpose: any / context: any / index: num";
 * const schema = newSchema(str);
 */
export function newSchema(str: string): HDSchema {
    const segments = str.split(" / ");
    if (segments.length > 256) {
        throw new RangeError(`derivation path schema cannot exceed 256 segments, got "${segments.length}"`);
    }
    if (segments[0] !== "m") {
        throw new SyntaxError(`root segment in schema must be designated by "m", got "${segments[0]}"`);
    }
    const allowed = new Set(["str", "num", "any"]); // Allow strings, numbers, or either
    const result: HDSchema = []; // Allocate array for the parsed schema
    for (const segment of segments.slice(1)) {
        const [label, type] = segment.split(":").map(s => s.trim()); // Separate the label and the type
        if (!label || !type) {
            throw new SyntaxError(`invalid segment in schema, "${segment}"`);
        }
        if (!allowed.has(type)) {
            throw new TypeError(`invalid type "${type}" for label "${label} in schema"`);
        }
        result.push([label, type]); // Add the label and type to the parsed results
    }
    return result; // Return parsed schema
}

/**
 * newPath parses a new derivation path from a given hash, string, and schema.
 * @example
 * const path = newPath(h, "m/42/0/1/0", schema);
 */
export function newPath(h: CHash, str: string, schema: HDSchema): HDPath {
    const pathArray = str.split("/");
    const [root, ...indices] = pathArray;
    if (root != "m") {
        throw new SyntaxError(`master key in derivation path must be designated by "m", got "${root}"`);
    }
    if (indices.length > schema.length) {
        throw new RangeError(`too many indices in derivation path: got "${indices.length}", expected "${schema.length}"`);
    }
    const result: number[] = []; // Allocate array for the parsed path
    for (let i = 0; i < indices.length; i++) {
        const [label, type] = schema[i]; // Get label and type for the current index from the schema
        let index: number;
        try {
            index = getIndex(h, indices[i], type); // Parse the current index, enforcing the type from the schema
        } catch (error) {
            if (error instanceof Error) {
                const IndexError = error.constructor as new (message: string) => Error;
                throw new IndexError(`derivation path position ${i} label "${label}", ${error.message}`);
            }
            throw error;
        }
        result.push(index); // Add the parsed index to the result
    }
    return result; // Return the parsed derivation path
}
