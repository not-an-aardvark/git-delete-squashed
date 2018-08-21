# git-delete-squashed

This is a tool that deletes all of your git branches that have been "squash-merged" into master.

This is useful if you work on a project that squashes branches into master. After your branch is squashed and merged, you can use this tool to clean up the local branch.

## Usage

```bash
$ npm install --global raquelxmoss/git-delete-squashed
$ git-delete-squashed
```

## Options

`--dry-run` prints a list of the branches that would be deleted, but does not delete them.

## Details

To determine if a branch is squash-merged, git-delete-squashed creates a temporary dangling squashed commit with [`git commit-tree`](https://git-scm.com/docs/git-commit-tree). Then it uses [`git cherry`](https://git-scm.com/docs/git-cherry) to check if the squashed commit has already been applied to `master`. If so, it deletes the branch.
