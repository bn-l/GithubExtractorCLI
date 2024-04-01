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
    metafile: true
});

fs.writeFileSync('esbuild-meta.json', JSON.stringify(result.metafile))



