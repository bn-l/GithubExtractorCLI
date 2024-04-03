
# github-extractor

<div align="center">
    <img src="./media/logo-1024.webp" alt="header logo: Github Extractor CLI" width="35%" height="35%">
</div>



List github repositories and download individual files or whole repos conveniently. Faster than clone depth=1 for an entire repo and much faster if you just need a single file

See an Asciinema video of usage (including with [fzf](https://github.com/junegunn/fzf)) here: https://bn-l.github.io/GithubExtractor/cli/
 
<div align="center" style="display: flex; justify-content: center; gap: 10px;">
<img src="https://github.com/bn-l/GithubExtractorCLI/actions/workflows/ci.yml/badge.svg" alt="Continuous Integration status badge">   <a href="coverage/coverage.txt"><img src="./media/coverage-badge.svg" alt="Code coverage badge"></a>  <a href="https://github.com/bn-l/GithubExtractorCLI/issues"><img src="https://img.shields.io/github/issues/bn-l/GithubExtractorCLI" alt="GitHub issues badge"></a>  <a href="https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request"> <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="Pull requests welcome badge"> </a>
</div>


<br/><br/>


## Usage: 

```bash
ghe [options] <paths...>
```

To get help message:
```bash
ghe -h
```

## Arguments:

### paths

One or more paths to download. Can be a whole 
repo, a folder or a file. Supports globs.
To exclude use a negative glob ("!" at the beginning).
Can mix paths from different repos (conflicts resolved
left to right). A trailing slash means a whole folder.


## Options:

### -l, --list 

List files. Useful as a dry run and with fzf. Does not
download. Will show show conflicts for the current 
working directory if -d / --dest is not specified.

### -c, --conflicts-only  

Only show conflicts when listing.

### -d, --dest <folder>    

Destination folder. Defaults to the current directory.

### -i, --case-insensitive      

Ignores case when checking for conflicts. Default is 
case-sensitive--i.e. casing matters.

### -k, --keep-if <condition>   

"newer" | "existing". Will keep conflicting files 
if they exist or are newer. WARNING: The
default is to overwrite existing silently.

### -q, --quiet    

No success or error messages.     

### --colors    

Use ansi escape characters to color output.
Default true but respects the NO_COLOR env var if set. 

## Downloading Examples:

Entire repo:
```bash             
ghe facebook/react
```
Specific folder:
```bash
ghe facebook/react/packages/*
```
Specify destination:
```bash
ghe -d local/dest facebook/react
```
Specific files
```bash
ghe facebook/react/.circleci/config.yml  facebook/react/.github/stale.yml
```
Different repos mixed together"
```bash
ghe facebook/react  micromatch/picomatch
```


### Listing Examples:

Only conflicts
```bash
ghe -lc -d local/dest  facebook/react
```
Specific folder
```bash
ghe -l facebook/react/.circleci/*
```


<!-- Everything after the snip is snipped off -->
<!-- SNIP -->