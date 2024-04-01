
import fs from "node:fs";
import { findUpSync } from "find-up";


const packageConfigProperties = [
    "name",
    "version",
    "description",
    "bin",
] as const;

function getPackageJson(): { [K in typeof packageConfigProperties[number]]: string } {

    const packagePath = findUpSync("package.json", { cwd: import.meta.url });

    if (!packagePath) throw new Error("Could not find package.json file");
    
    const modulePackageFile = fs.readFileSync(packagePath, "utf8");
    const packageJson = JSON.parse(modulePackageFile);

    if (!packageConfigProperties.every(prop => prop in packageJson)) {
        throw new Error(`Missing properties in package.json: ${ packageConfigProperties.filter(prop => !(prop in packageJson)).join(", ") }`);
    }

    return packageJson as { [K in typeof packageConfigProperties[number]]: string };
}

export const packageJson = getPackageJson();
