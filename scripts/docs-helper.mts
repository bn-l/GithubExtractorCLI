import fs from "node:fs";


fs.cpSync("./media", "./docs/public", { recursive: true });

console.log("Copied ./media to ./docs/public");
