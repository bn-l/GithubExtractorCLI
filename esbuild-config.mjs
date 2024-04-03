import * as esbuild from 'esbuild'
import fs from 'node:fs'


const result = await esbuild.build({
    entryPoints: ['./source/index.mts'],
    bundle: true,
    outfile: './out.js',
    platform: 'node',
    minify: true,
    treeShaking: true,
    drop: ["console", "debugger"],
    metafile: true,
    format: "esm",
    
    
    // mainFields: ['module', 'main'], // test if changing this makes a diff
});

fs.writeFileSync('esbuild-meta.json', JSON.stringify(result.metafile))



