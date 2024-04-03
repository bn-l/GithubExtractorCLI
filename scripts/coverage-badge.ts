
import { badgen } from "badgen";
import fs from "node:fs";


interface Coverage {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
}

interface FileCoverage {
    lines: Coverage;
    functions: Coverage;
    statements: Coverage;
    branches: Coverage;
    branchesTrue?: Coverage;
}

interface CoverageSummary {
    total: FileCoverage;
    [filePath: string]: FileCoverage;
}

const summaryPath = "./coverage/coverage-summary.json";


const coverageFile = fs.readFileSync(summaryPath, { encoding: "utf8" });
const coverage = JSON.parse(coverageFile, (k, v) => v === "Unknown" ? -1 : v) as CoverageSummary;


const statements = coverage.total.statements.pct;
const branches = coverage.total.branches.pct;
const functions = coverage.total.functions.pct; 
const lines = coverage.total.lines.pct;

let color: string = "green";

if (statements < 0) {
    color = "grey";
}
else if (statements < 70) {
    color = "red";
}
else if (statements < 80) {
    color = "yellow";
}
else if (statements < 90) {
    color = "orange";
}
else {
    color = "green";
}

const svg = badgen({
    label: statements == 100 ? "✔ coverage" : "coverage",
    status: `${ statements }%`,
    color,
});

fs.mkdirSync("./media/", { recursive: true });

fs.writeFileSync("./media/coverage-badge.svg", svg);

fs.rmSync(summaryPath);
