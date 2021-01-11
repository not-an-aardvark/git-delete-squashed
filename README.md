# @teppeis/git-delete-squashed (forked)

This is a tool that deletes all of your git branches that have been "squash-merged" into default branch (master or main).

This is useful if you work on a project that squashes branches into default branch. After your branch is squashed and merged, you can use this tool to clean up the local branch.


## Guessing default branch (difference from original)

1. If env `DEFAULT_BRANCH` is set, use it.
2. If the repo has local branch `master`, use it.
3. If the repo has local branch `main`, use it.
4. Throws an error.

## Usage

### sh

To run as a shellscript, simply copy the following command (setting up an alias is recommended). There's no need to clone the repo. (If the default branch is `main`)

```bash
git checkout -q main && git for-each-ref refs/heads/ "--format=%(refname:short)" | while read branch; do mergeBase=$(git merge-base main $branch) && [[ $(git cherry main $(git commit-tree $(git rev-parse $branch\^{tree}) -p $mergeBase -m _)) == "-"* ]] && git branch -D $branch; done
```

### Node.js

You can also install the tool as a Node.js package from NPM. (The package code is in this repo.)

```bash
$ npx @teppeis/git-delete-squashed
```

## Details

To determine if a branch is squash-merged, git-delete-squashed creates a temporary dangling squashed commit with [`git commit-tree`](https://git-scm.com/docs/git-commit-tree). Then it uses [`git cherry`](https://git-scm.com/docs/git-cherry) to check if the squashed commit has already been applied to `main`. If so, it deletes the branch.
