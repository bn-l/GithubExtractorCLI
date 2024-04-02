
import pm from "picomatch";


const w = "src/hello/yoo.txt";
const x = "src/{index,utils}.js";
const y = "src/*.js";
const z = "**/*.js";


console.log(pm.compileRe(pm.parse(w), { nocase: true }));
console.log(pm.compileRe(pm.parse(x), { nocase: true }));
console.log(pm.compileRe(pm.parse(y), { nocase: true }));
console.log(pm.compileRe(pm.parse(x), { nocase: true }));

console.log(new RegExp(/someregex/gm));
