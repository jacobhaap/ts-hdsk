# TypeScript HDSK
TypeScript HDSK is an implementation of Hierarchical Deterministic Symmetric Keys, a method of symmetric key generation using schema-driven derivation paths for generating nodes in hierarchies descending from master keys. Natively in **TypeScript**, with **ESM** and **CommonJS** compatibility. To get started, install the library:
```
# Deno
deno add jsr:@iacobus/hd

# Node.js
npm install @iacobus/hd
```
This is a reference implementation of the specification titled *["Hierarchical Deterministic Symmetric Keys"](https://gist.github.com/jacobhaap/d75c96f61bcc32154498842e620a3261)*.

Both stateful and stateless functionality are provided, across three entry points. A stateful encapsulation of key derivation, and the handling of schemas and derivation paths is provided by the **@iacobus/hd** entry point.

## Types
Parsed derivation path schemas are of the `HDPath` type, and parsed derivation paths are of the `HDSchema` type. All keys derived by this library are of the `HDKey` type, an object that holds the 32 byte cryptographic key, 32 byte chain code, an integer representing the hierarchical depth, and a 16 byte fingerprint.
```ts
export type HDSchema = [string, string][];

export type HDPath = number[];

type HDKey = {
    key: Uint8Array,
    code: Uint8Array,
    depth: number,
    fingerprint: Uint8Array
}
```

# Derivation Paths
When generating a node in a hierarchy descending from a master key, a derivation path is required. The expected length and expected types for child key indices of a derivation path is enforced by a derivation path schema. Stateless functionality for the handling of schemas and derivation paths is provided by the **@iacobus/hd/path** entry point.

### Schemas
Schemas are strings that contain a series of segments to define the expected pattern of a derivation path. Each segment of a schema contains a label and a type for labeling of indices. Permitted types are ***str*** for string, ***num*** for integer, and ***any*** for either. A schema can be parsed from a string using the `Hdsk.schema` method, returning a new **Schema** instance. The public `Schema.schema` property contains the parsed schema as an *HDSchema* (array of tuples). Stateless functionality for schema parsing is available from the `newSchema` function.

### Paths
Derivation paths are strings that define a hierarchical sequence of child key indices, descending from a master key. Each segment in the path corresponds to a level in the hierarchy, and its value may be an integer or a string. A derivation path can be parsed from a string using the `Schema.parse` method, returning a parsed derivation path as an *HDPath* (array of integers). A hash function is required for parsing. Stateless functionality for derivation path parsing is available from the `newPath` function.

### Example
```ts
import { Hdsk } from "@iacobus/hd";
import { sha256 } from "@noble/hashes/sha2";

// Parse the derivation path schema
const str = "m / application: any / purpose: any / context: any / index: num";
const schema = new Hdsk().schema(str);

// Parse the derivation path using the schema
const h = sha256;
const path = schema.parse(h, "m/42/0/1/0");
```

# Generating Keys
For the generation of HD keys, keys can exist as either a master key or a child key. Master keys are derived from a given secret, and child keys are derived from a master key from a given index, or a parsed derivation path for deriving specific nodes in a hierarchy. Stateless functionality for HD key derivation, and verification of key lineage, is provided by the **@iacobus/hd/key** entry point.

## Master & Child Keys
Master keys are derived from a secret using the `Hdsk.master` method, which expects the secret as a *Uint8Array*. The derived master key is returned as a new **Key** instance. The public `Key.key` property contains the HD key. A hash function is required to derive a new master key. Stateless functionality for deriving master keys is available from the `deriveMaster` function.

Child keys are derived from an index and a **Key** instance using the `Key.child` method, which expects the index as a *number*. The target instance acts as the master key for child derivation, using the key's chain code as the secret, and using the same hash function. The derived child key is returned as a new **Key** instance. Stateless functionality for deriving child keys is available from the `deriveChild` function.

*Example use:*
```ts
import { Hdsk } from "@iacobus/hd";
import { sha256 } from "@noble/hashes/sha2";

// Generate a new master key
const h = sha256;
const secret = new Uint8Array(32);
const master = new Hdsk().master(h, secret);

// Generate a child key from the master key
const child = master.child(42);
```

### Nodes in a Hierarchy
Keys at specific nodes in a hierarchy descending from a master key are derived from a derivation path and a **Key** instance using the `Key.node` method, which expects the derivation path as an *HDPath*. The target instance acts as the master key for deriving the node, using the key's chain code as the secret to initialize the first key in the sequence of child key indices, with subsequent keys are derived from their corresponding index and the chain code of the previous key in the hierarchy, repeating until the target node is derived. The same hash function as the master key is used throughout this process. The derived node is returned as a new **Key** instance. Stateless functionality for deriving nodes is available from the `deriveNode` function.

*Example use:*
```ts
import { Hdsk } from "@iacobus/hd";
import { sha256 } from "@noble/hashes/sha2";

// Use sha256 as the hash function
const h = sha256;

// Generate a new master key
const secret = new Uint8Array(32);
const master = new Hdsk().master(h, secret);

// Parse a derivation path
const str = "m / application: any / purpose: any / context: any / index: num";
const schema = new Hdsk().schema(str);
const path = schema.parse(h, "m/42/0/1/0");

// Generate a node using a derivation path
const node = master.node(path);
```

### Key Lineage
The lineage of a **Key** instance can be verified using the `Key.lineage` method, using the key's fingerprint to verify that it is the direct child of a given master key. The master key is expected as an *HDKey*. While master keys contain their own fingerprints, the lineage of master keys cannot be verified as they lack parent keys. The *boolean* result of the lineage verification is returned. Stateless functionality for lineage verification is available from the `lineage` function.

Example use:
```ts
import { Hdsk } from "@iacobus/hd";
import { sha256 } from "@noble/hashes/sha2";

// Generate a new master key
const h = sha256;
const secret = new Uint8Array(32);
const master = new Hdsk().master(h, secret);

// Generate a child key from the master key
const child = master.child(42);

// Verify the lineage of the child key
const related = child.lineage(master.key);
```
