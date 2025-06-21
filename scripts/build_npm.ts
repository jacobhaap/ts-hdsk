import { build, emptyDir } from "jsr:@deno/dnt@0.42.1";

await emptyDir("./npm");

await build({
    entryPoints: [
    "./src/mod.ts",
    { name: "./key", path: "./src/key.ts" },
    { name: "./path", path: "./src/path.ts" },
  ],
    outDir: "./npm",
    shims: {
        deno: true
    },
    test: false,
    package: {
        // package.json properties
        name: Deno.args[0],
        version: Deno.args[1],
        description: "Hierarchical Deterministic Symmetric Keys.",
        license: "MIT",
        homepage: "https://github.com/jacobhaap/ts-hdsk#readme",
        repository: {
            type: "git",
            url: "git+https://gitlab.com/jacobhaap/ts-hdsk.git"
        },
        bugs: {
            url: "https://github.com/jacobhaap/ts-hdsk/issues"
        },
        author: {
            name: "Jacob V. B. Haap",
            url: "https://iacobus.xyz/"
        },
        keywords: [
            "hd",
            "symmetric",
            "hierarchical",
            "deterministic",
            "key"
        ]
    },
    postBuild() {
        // steps to run after building and before running the tests
        Deno.copyFileSync("LICENSE", "npm/LICENSE");
        Deno.copyFileSync("README.md", "npm/README.md");
    }
})
