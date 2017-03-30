# git-delete-squashed

This is a tool that deletes all of your git branches that have been "squash-merged" into master.

This is useful if you work on a project that squashes branches into master. After your branch is squashed and merged, you can use this tool to clean up the local branch.

## Installation

Node 4+ is required.

```bash
$ npm install --global git-delete-squashed
```

## Usage

From a git repo:

```bash
$ git-delete-squashed
```

You can also set up a [git alias](https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases) if you don't want to type `git-delete-squashed` every time. For example, to alias this command to `git ds`, you can use:

```bash
$ git config --global alias.ds !git-delete-squashed
```

## Details

To determine if a branch `b` is squash-merged, the following algorithm is used:

1. Find the most recent ancestor commit `ancestor` between `master` and `b`.
1. Compute the diff between `ancestor` and `b`.
1. If there are any commits between `ancestor` and `master` whose diff matches the diff between `ancestor` and `b`, the branch is squash-merged.

`git-delete-squashed` iterates over all local branches and deletes the ones that are squash-merged.
