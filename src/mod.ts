/**
 * @fileoverview Entry point for @iacobus/hd.
 * Exports the Hdsk class, which exposes functionality for symmetric hierarchical
 * deterministic key derivation, including master key derivation and schema-enforced
 * derivation path parsing.
 * @module
 * @author Jacob V. B. Haap <iacobus.xyz>
 * @license MIT
 */

import type { CHash } from "npm:@noble/hashes@1.8.0/utils";
import { type HDSchema, type HDPath, newSchema, newPath } from "./path.ts";
import { type HDKey, deriveMaster, deriveChild, deriveNode, lineage } from "./key.ts";

/** Schema is an instance of a derivation path schema. */
export class Schema {
    public schema: HDSchema;
    constructor(str: string) {
        const schema = newSchema(str);
        this.schema = schema;
    }
    /**
     * parse parses a new derivation path from a given hash and string.
     * @example
     * const path = Schema.parse(h, "m/42/0/1/0");
     */
    parse(h: CHash, str: string): HDPath {
        const path = newPath(h, str, this.schema);
        return path;
    }
}

/** Key is an instance of an HD key. */
export class Key {
    public key: HDKey;
    public h: CHash;
    constructor(h: CHash, key: HDKey) {
        this.h = h;
        this.key = key;
    }
    /**
     * child derives a new child key from a given index.
     * @example
     * const child = Key.child(42);
     */
    child(index: number): Key {
        const key = deriveChild(this.h, this.key, index);
        return new Key(this.h, key);
    }
    /**
     * node derives a new key at a specific node in a hierarchy in
     * relation to a master key, from a given derivation path.
     * @example
     * const node = Key.node(path);
     */
    node(path: HDPath): Key {
        const key = deriveNode(this.h, this.key, path);
        return new Key(this.h, key);
    }
    /**
     * lineage checks if a key is the direct child of a master key,
     * from a given hash master key.
     * @example
     * const related = Key.lineage(master.key);
     */
    lineage(master: HDKey): boolean {
        const related = lineage(this.h, this.key, master);
        return related;
    }
}

/**
 * Hdsk exposes functionality for hierarchical deterministic symmetric key derivation.
 * It provides methods to derive master keys and parse derivation path schemas, used to
 * initialize key hierarchies, and parse schema-enforced derivation paths.
 */
export class Hdsk {
    /**
     * schema parses a new derivation path schema from a given string.
     * @example
     * const str: string = "m / application: any / purpose: any / context: any / index: num";
     * const schema = new Hdsk().schema(str);
     */
    schema(str: string): Schema {
        return new Schema(str);
    }
    /**
     * master derives a new master key from a given hash and secret.
     * @example
     * const master = new Hdsk().master(h, secret);
     */
    master(h: CHash, secret: Uint8Array): Key {
        const key = deriveMaster(h, secret);
        return new Key(h, key);
    }
}
