
import fs from "node:fs";


const config = [
    "name",
    "bin",
    "longName",
    "version",
    "description",
    "repoUrl",
    "docsUrl",
    "author",
    "license",
    "summary",
    "tagline",
] as const;

function getPackageJson(): { [K in typeof config[number]]: string } {
    
    const modulePackageFile = fs.readFileSync("./package.json", "utf8");
    const packageJson = JSON.parse(modulePackageFile);

    packageJson["repoUrl"] = packageJson["repository"]["url"];
    const firstBinKey = Object.keys(packageJson["bin"])[0] ?? "";
    packageJson["bin"] = packageJson["bin"][firstBinKey];
 
    for (const prop of config) {
        if (!packageJson[prop]) {
            throw new Error(`getConfig: Property ${ prop } not found in package.json when trying to build config object.`);
        }
    }

    return packageJson as { [K in typeof config[number]]: string };
}

const packageJson = getPackageJson();

export default packageJson;
