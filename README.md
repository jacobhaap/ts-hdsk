# TypeScript | Symmetric HD
Symmetric HD is an implementation of Hierarchical Deterministic (HD) keys in a symmetric context. Blake2b and an HKDF-Blake2b implementation are utilized as the cryptographic primitives.

Natively in **TypeScript**, with **ESM** and **CommonJS** compatibility. To get started, install the library:
```
# Deno
deno add jsr:@iacobus/hd

# Node.js
npm install @iacobus/hd
```

All functionality for the derivation of HD keys, and handling of derivation paths, is available from the `SymmetricHD` class, and as standalone exports.

## HDKey Type
All keys derived by this library are of the `HDKey` type, an object that holds the 32 byte symmetric key, the chain code, and metadata including the depth in the hierarchy, derivation path, and the key's fingerprint.
```ts
type HDKey = {
    key: Uint8Array, // Key
    code: Uint8Array, // Chain Code
    depth: number, // Depth in hierarchy
    path: string, // Derivation path
    fingerprint: Uint8Array // Fingerprint
}
```

# Derivation Paths
When deriving an HD key in a nested hierarchy, a derivation path is required. All derivation paths are required to follow a schema, which may be defined with the `schema` method of **SymmetricHD**, which returns a new instance of a `PathSchema`. Derivation paths can be validated and parsed against a schema with the `parse` method of a **PathSchema** instance.

## Path Schemas
Schemas assign labels to indices of a derivation path, as a method to assign a purpose or context. Labels are typed, as either a string `str`, integer `num`, or `any` for either of the two. A derivation path schema must always begin with `m` to designate the master key. Schemas are divided into segments, with each segment containing a label and type as `label: type`, and not exceeding 256 segments in the schema (including the master key segment). The *schema* method of **SymmetricHD** expects a ***schema*** as a *string*.

*Default schema:*
```
m / application: any / purpose: any / context: any / index: num
```

*Example use:*
```ts
import { SymmetricHD } from "@iacobus/hd";

const str: string = "m / application: any / purpose: any / context: any / index: num";
const schema = new SymmetricHD().schema(str);
```
## Derivation Path Parsing
A derivation path is parsed using a schema to enforce type and validity. The number of indices may not exceed the number of segments from the schema, and each index must fall in the range **0** to **2³¹-1**. When an index is provided as a string, during parsing it converts to a 32 bit integer. The *parse* method of **PathSchema** expects the derivation ***path*** as a *string*.

*Default derivation path:*
```
m/42/0/1/0
```

*Example use:*
```ts
import { SymmetricHD } from "@iacobus/hd";

const str: string = "m / application: any / purpose: any / context: any / index: num";
const schema = new SymmetricHD().schema(str);
const path = schema.parse("m/42/0/1/0");
```

# Key Derivation
Derivation of HD keys always begins from the derivation of a master key from a secret. From a master key, a child key may be derived at a selected in-range index. Child keys may also be derived from other child keys. Child key derivation always derives a key at a depth of 1 deeper in the hierarchy than the parent node. For derivation in a nested hierarchy, a master or child key combined with a derivation path derives a child key at a node in the hierarchy corresponding to the indices contained in the path.

## Master Keys
Master keys are derived from a ***secret*** using the `master` method of **SymmetricHD**. The ***secret*** is expected as either a UTF-8 or hex-encoded *string*, or a *Uint8Array*. The *master* method returns a new instance of a `MasterKey`.
```ts
import { SymmetricHD } from "@iacobus/hd";

const secret: string = "747261636B6572706C61747A";
const master = new SymmetricHD().master(secret);
```

## Child Keys
Child keys are derived from an instance of a **MasterKey**, or an instance of another `ChildKey`, at a specified ***index***, using the `deriveChild` method. The ***index*** is expected as either a UTF-8 or hex-encoded *string*, or a *Uint8Array*. The *deriveChild* method returns a new instance of a *ChildKey*.
```ts
import { SymmetricHD } from "@iacobus/hd";

const secret: string = "7265706C696372";
const parent = new SymmetricHD().master(secret);
const child = parent.deriveChild(2019);
```

## Path-Based Key Derivation
Hierarchical deterministic keys in a nested hierarchy defined by a derivation path can be derived from a ***key*** and a ***path***, using the `derive` method of **SymmetricHD**. The ***key*** is expected as a **KeyInstance** (*MasterKey or ChildKey*), and the ***path*** is expected as a parsed derivation path. The *derive* method returns a new instance of a *ChildKey*.
```ts
import { SymmetricHD } from "@iacobus/hd";

// New instance of SymmetricHD
const hd = new SymmetricHD();

// Define a schema and parse the derivation path
const str: string = "m / application: any / purpose: any / context: any / index: num";
const schema = hd.schema(str);
const path = schema.parse("m/42/0/1/0");

// Derive a master key
const secret: string = "747261636B6572706C61747A";
const master = hd.master(secret);

// Derive the key from the master key and derivation path
const key = hd.derive(master, path);
```

## Lineage Verification
All keys, including master keys, include a fingerprint that acts as a unique identifier for the key, and can be used to verify that a key is derived from a given secret, or that it is the direct child of a parent key. The verification of key lineage is completed using the `lineage` method of a *MasterKey* or *ChildKey* instance. This method expects a ***parent*** as an *HDKey*, and returns a *boolean* result of the lineage verification.
```ts
import { SymmetricHD } from "@iacobus/hd";

// Derive the parent and child keys
const secret: string = "7265706C696372";
const parent = new SymmetricHD().master(secret);
const child = parent.deriveChild(2019);

// Verify the lineage of the child key
const lineage = child.lineage(parent.key);
```
