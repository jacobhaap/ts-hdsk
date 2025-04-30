import { build, emptyDir } from "jsr:@deno/dnt@0.41.3";

await emptyDir("./npm");

await build({
    entryPoints: ["./src/mod.ts"],
    outDir: "./npm",
    shims: {
        deno: true
    },
    package: {
        // package.json properties
        name: Deno.args[0],
        version: Deno.args[1],
        description: "Symmetric Hierarchical Deterministic Keys.",
        license: "MIT",
        homepage: "https://github.com/jacobhaap/ts-symmetric-hd#readme",
        repository: {
            type: "git",
            url: "git+https://gitlab.com/jacobhaap/ts-symmetric-hd.git"
        },
        bugs: {
            url: "https://github.com/jacobhaap/ts-symmetric-hd/issues"
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
