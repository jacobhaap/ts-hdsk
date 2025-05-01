/**
 * @fileoverview Provides functionality for parsing derivation paths and schemas.
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

import { getIndex } from "./utils.ts";

/** Derivation Path. */
export type Path = number[];

/** Derivation path schema parsing class, includes a method for parsing derivation paths using a schema. */
export class PathSchema {
    public schema: [string, string][]; // Define public 'schema' property as a Schema ([string, string][])
    // Constructor to parse & validate a derivation path schema
    constructor(schema: string) {
        const segments = schema.split(" / "); // Split the schema into segments
        if (segments.length > 256) {
            // Throw an error if the schema exceeds 256 segments (including the root segment)
            throw new Error(`derivation path schema cannot exceed 256 segments, got "${segments.length}"`);
        }
        if (segments[0] !== "m") {
            // Throw an error if the root segment is not identified by 'm'
            throw new Error(`root segment must be designated by "m", got "${segments[0]}"`);
        }
        const allowedTypes = new Set(["str", "num", "any"]); // Allow strings and numbers ('any' for either)
        const result: [string, string][] = []; // Initialize 'result' array for the parsed schema
        // Iterate over segments of the schema, starting after the root
        for (const segment of segments.slice(1)) {
            const [label, type] = segment.split(":").map(s => s.trim()); // Separate the label and the type
            if (!label || !type) {
                // Mark invalid if the label or type is missing
                throw new Error(`invalid segment, "${segment}"`);
            }
            if (!allowedTypes.has(type)) {
                // Mark invalid if the type does not match 'allowedTypes'
                throw new Error(`invalid type "${type}" for label "${label}"`);
            }
            result.push([label, type]); // Add the label and type to the parsed results
        }
        this.schema = result; // Return the parsed schema
    }
    /**
     * Validate and parse a derivation path from a string, using a path schema.
     * @example
     * const path = schema.parse("m/42/0/1/0");
     */
    parse(path: string): Path {
        const pathArray = path.split("/"); // Split the path into segments
        const [root, ...indices] = pathArray; // Isolate the root from the indices
        if (root != "m") {
            // Throw an error if the root segment is not identified by 'm'
            throw new Error(`master key must be designated by "m", got "${root}"`);
        }
        if (indices.length > this.schema.length) {
            // Throw an error if the path exceeds the schema length
            throw new Error(`too many indices: got "${indices.length}", expected "${this.schema.length}"`);
        }
        const result: number[] = []; // Initialize 'result' array for the parsed path
        // Iterate over the indices
        for (let i = 0; i < indices.length; i++) {
            const [label, type] = this.schema[i]; // Get label and type for the current index 'i' from the schema
            let index: number;
            try {
                index = getIndex(indices[i], type); // Parse the current index, enforcing the type from the schema
            } catch (error) {
                // Throw the error returned by 'getIndex' with the label and position 
                throw new Error(`position "${i}" label "${label}", ${error}`);
            }
            result.push(index); // Add the parsed index to the result
        }
        return result; // Return the parsed derivation path
    }
}
