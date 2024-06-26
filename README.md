
# GHEX

Github Extractor CLI

<div align="center">
    <img src="./media/logo-1024.webp" alt="header logo: Github Extractor CLI" width="35%" height="35%">
</div>



List github repositories or download individual files or whole repos conveniently. Faster than clone depth=1 for an entire repo and much faster if you just need a single file

See an Asciinema video of usage (including with [fzf](https://github.com/junegunn/fzf)) below.
 
<div align="center" style="display: flex; justify-content: center; gap: 10px;">
<img src="https://github.com/bn-l/GithubExtractorCLI/actions/workflows/ci.yml/badge.svg" alt="Continuous Integration status badge">   <a href="coverage/coverage.txt"><img src="./media/coverage-badge.svg" alt="Code coverage badge"></a>  <a href="https://github.com/bn-l/GithubExtractorCLI/issues"><img src="https://img.shields.io/github/issues/bn-l/GithubExtractorCLI" alt="GitHub issues badge"></a>  <a href="https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request"> <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="Pull requests welcome badge"> </a>
</div>

<br />
<!-- ABOVE SNIP -->

<img src="./media/ghex-svg-cat.svg" />

## Quickstart CLI

Install [node](https://nodejs.org/en/download) then:

```bash
npx ghex -h
```

Or:

```bash
npm install -g ghex
```

## Usage


```bash
ghex [options] <paths...>
```

## Arguments

### paths

One or more paths to download. Can be a whole repo, or a 
folder or a file within it. Supports globs but the path 
should be quoted. To exclude use a negative glob ("!" at 
the beginning). Can mix paths from different repos 
(conflicts resolved left to right). A trailing slash means
a whole folder. Conflicting files are skipped by default.

## Options

### -l, --list 

List files. Useful as a dry run and with fzf. Does not
download. Will show show conflicts for the current working
directory or -d / --dest.

### -p, --prefix         

Append the owner/repo prefix to the path in list output. 
This is useful for feeding back into ghex.

### -c, --conflicts-only  

Only show conflicts when listing.

### -d, --dest (folder)   

Destination folder. Defaults to the current directory.

### -i, --case-insensitive      

Ignores case when checking for conflicts. Default is 
case-sensitive--i.e. casing matters.

### -f, --force

Overwrite all existing conflicting files. Default false.

### -e, --echo-paths        

After writing, outputs the path of each file plus a new line.
Useful for piping to other commands. Also sets -quiet &
--no-color.

### -s, --strip (number)

Strip the first n directories from paths. If a path doesn't 
have enough directories to strip, it's skipped.

### -q, --quiet    

No success or error messages.     

### --no-prefix    

Remove the owner/repo prefix from the path in list output

### --no-colors         

Strip ansi escape characters used to color output.
ghex respects the NO_COLOR env var if set also. 


## Downloading Examples:

Entire repo:
```bash             
npx ghex facebook/react
```
Specific folder:
```bash
npx ghex "facebook/react/packages/*"
```
Specify destination:
```bash
npx ghex -d local/dest facebook/react
```
Specific files
```bash
npx ghex facebook/react/.circleci/config.yml  facebook/react/.github/stale.yml
```
Different repos mixed together"
```bash
npx ghex facebook/react  micromatch/picomatch
```


### Listing Examples:

Only conflicts
```bash
npx ghex -lc -d local/dest  facebook/react
```
Specific folder
```bash
npx ghex -l "facebook/react/.circleci/*"
```


<!-- Everything after the snip is snipped off -->
<!-- SNIP -->