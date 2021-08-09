# git-delete-squashed

This is a tool that deletes all of your git branches that have been "squash-merged" into master.

This is useful if you work on a project that squashes branches into master. After your branch is squashed and merged, you can use this tool to clean up the local branch.

## Usage

### sh

To run as a shellscript, simply copy the following command (setting up an alias is recommended). There's no need to clone the repo.

```bash
git checkout -q master && git for-each-ref refs/heads/ "--format=%(refname:short)" | while read branch; do mergeBase=$(git merge-base master $branch) && [[ $(git cherry master $(git commit-tree $(git rev-parse $branch\^{tree}) -p $mergeBase -m _)) == "-"* ]] && git branch -D $branch; done
```

### Node.js

You can also install the tool as a Node.js package from NPM. (The package code is in this repo.)

```bash
$ npm install --global git-delete-squashed
$ git-delete-squashed
```

You can specify an alternate branch to check for squashed merges, as well. This is useful for different names of trunk branches like `main` or `develop`.

```bash
$ npm install --global git-delete-squashed
$ git-delete-squashed main
```


## Details

To determine if a branch is squash-merged, git-delete-squashed creates a temporary dangling squashed commit with [`git commit-tree`](https://git-scm.com/docs/git-commit-tree). Then it uses [`git cherry`](https://git-scm.com/docs/git-cherry) to check if the squashed commit has already been applied to `master`. If so, it deletes the branch.
