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

To determine if a branch is squash-merged, git-delete-squashed checks the diff from where the branch diverges from master to the current state of the branch, and checks the diff of all commits to master since the branch was created. If any of the commits match the branch diff, the branch is deleted.
