
// name: github-dl
// bin: gdl

// Names:
// cli version: ghe
// class version: github-extractor / GithubExtractor  

// ! Use bundler 

// cli:
// ----
// https://github.com/ and blob/{master,main} are removed automatically if found
//    first argument is then parsed:
// bin -u user/repo <-- first element of path is the user 
// bin user/repo/path/to/file (assumed everything after "repo" is a route to a file / dir)
// bin -ls repo
//     (critical!) will list files in repo/path/to/fileOrDir format so the result can
//      be piped back into the command. E.g.
//        github-dl -ls | fzf | github-dl
// -l: gets file list 
// -c: list conflicts (can use the listing function the list conflicts--no coloring)
// -l -c / -lc: List with conflicts warning (wraps conflicting files with chalk.red)
// -f filter (works with all options )

// Conflicts on extracting (i.e. when not using the -l option) will stop the app, list conflicts, and then ask for confirmation. If it takes up more than x amount of available space to list the conflicts then truncate with the total number and suggest running with -lc option.
// - when running non cli will return a status object with {status: "conflicts", data: conflicts}
// - set intersection to determine conflicts

// ! Use api for ent selection and tar for whole folder

// Filtering
// - Just pass arg to Regex (and fail and show error if it's not valid). split("/") to get body + flags. will only save files matching the filter. Use in node-tar filter function.

// Functions 
// List -- returns objects list with data including whether conflicts
// Extract -- 


// - let node-tar handle
//    writes and overwrites


// Todo:
// Separate select files function that first checks if the file exists in the default location.
// - Option to ignore overwrite warning (-i)
// - Access token support. See: https://github.com/isaacs/github/issues/554#issuecomment-778255274
//     and: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

// - Use with fzf: `bin $(bin args | fzf)` 
// - First list archi
// - Pipe into function that has 
// - If there will be files overwritten, yield with list of files
//      "continue" method on generator will continue the extraction.

// ! Apart from converting globs, do some clean up

// with globs
// ghe owner/repo <-special form, no options, one "/"
// ghe owner/repo/**
// ghe owner/repo/some/folder/*  <- can be called multiple times.
// ghe owner/repo/some/file.txt  <- file only
// 
// If glob not detected by picomatch, call downloadTo with selectedPaths
// If is detected, call downloadTo with converted regex

// ghe -d local/dest owner/repo
// ghe -d local/dest owner/repo/some/file1.txt owner/repo/some/file2.txt
// ghe -l -d local/dest owner/repo
