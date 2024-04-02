import { groupByOwner } from "./main.mjs";


console.log(groupByOwner({ paths: ["owner1/repo1/path1", "owner1/repo1/path2", "owner2/repo2/path1"] }));
