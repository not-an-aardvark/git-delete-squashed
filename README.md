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

To determine if a branch is squash-merged, git-delete-squashed creates a temporary dangling squashed commit with [`git commit-tree`](https://git-scm.com/docs/git-commit-tree). Then it uses [`git cherry`](https://git-scm.com/docs/git-cherry) to check if the squashed commit has already been applied to `master`. If so, it deletes the branch.
