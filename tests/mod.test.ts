import { 
    type Path, SymmetricHD, PathSchema,
    MasterKey, ChildKey
} from "../src/mod.ts";

/** Instance of SymmetricHD. */
const hd = new SymmetricHD();

// Initialize variables to be shared across tests
let schema: PathSchema
let path: Path;
let master: MasterKey;
let parent: MasterKey;
let child: ChildKey;

// Test for 'schema' method of SymmetricHD
// Validates and parses the string of a derivation path schema
// console.assert checks that 'schema' is an instance of a PathSchema
Deno.test(`Method 'schema' of SymmetricHD parses a path schema`, () => {
    const str: string = "m / application: any / purpose: any / context: any / index: num";
    schema = hd.schema(str);
    console.assert(schema instanceof PathSchema, `No instance of 'PathSchema' returned`);
})

// Test for 'parse' method of PathSchema
// Validates and parses the string of a derivation path
// console.assert checks that 'path' is a Path (number[])
Deno.test(`Method 'parse' of PathSchema parses a derivation path`, () => {
    path = schema.parse("m/42/0/1/0");
    console.assert(typeof path[0] === "number", `Failed to parse derivation path`);
})

// Test for 'master' method of SymmetricHD
// Derives a master key from a hex-encoded secret string
// console.assert checks that 'master' is an instance of a MasterKey
Deno.test(`Method 'master' of SymmetricHD derives a master key`, () => {
    const secret: string = "747261636B6572706C61747A";
    master = hd.master(secret);
    console.assert(master instanceof MasterKey, `No instance of 'MasterKey' returned`);
})

// Test for 'deriveChild' method of a key instance
// Derives a child key from a parent at index '2019'
// console.assert checks that 'child' is an instance of a ChildKey
Deno.test(`Method 'deriveChild' of a key instance derives a child key`, () => {
    const secret: string = "7265706C696372";
    parent = hd.master(secret);
    child = parent.deriveChild(2019);
    console.assert(child instanceof ChildKey, `No instance of 'ChildKey' returned`);
})

// Test for 'derive' method of SymmetricHD
// Derives a key in a nested hierarchy from a master key and derivation path
// console.assert checks that 'key' is an instance of a ChildKey
Deno.test(`Method 'derive' of SymmetricHD derives a key in a nested hierarchy`, () => {
    const key = hd.derive(master, path);
    console.assert(key instanceof ChildKey, `No instance of 'ChildKey' returned`);
})

// Test for 'lineage' method of a key instance
// Verifies the lineage of a child key against a parent key
// console.assert checks that 'lineage' is true
Deno.test(`Method 'lineage' of a key instance verifies a key's lineage`, () => {
    const lineage = child.lineage(parent.key);
    console.assert(lineage === true, `Key lineage verification failed, fingerprint mismatch`);
})
