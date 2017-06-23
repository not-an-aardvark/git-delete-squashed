#!/usr/bin/env node

'use strict';

const childProcess = require('child_process');
const Promise = require('bluebird');
const DEFAULT_BRANCH_NAME = 'master';

/**
 * Calls `git` with the given arguments from the CWD
 * @param {string[]} args A list of arguments
 * @param {string} [stdin] The stdin for the process
 * @returns {Promise<string>} The output from `git`
 */
function git (args, stdin) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn('git', args);

    if (typeof stdin === 'string') {
      child.stdin.write(stdin);
      child.stdin.end();
    }

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => stdout += data);
    child.stderr.on('data', data => stderr += data);

    child.on('close', exitCode => exitCode ? reject(stderr) : resolve(stdout));
  }).then(stdout => stdout.replace(/\n$/, ''));
}

const commitCache = new Map();
/**
 * Gets the patch id of a single commit
 * @param {string} hash The commit hash
 * @returns {Promise<string>} The diff of the commit with the given hash
 */
function getCommitDiffId (hash) {
  if (!commitCache.has(hash)) {
    commitCache.set(
      hash,

      // Use diff-tree rather than `diff commit^ commit` to avoid throwing if a root commit is found.
      git(['diff-tree', '--patch', '--no-commit-id', hash])
        .then(diff => git(['patch-id'], diff))
    );
  }
  return commitCache.get(hash);
}

git(['for-each-ref', 'refs/heads/', '--format=%(refname:short)'])
  .then(branchListOutput => branchListOutput.split('\n'))
  .tap(branchNames => {
    if (branchNames.indexOf(DEFAULT_BRANCH_NAME) === -1) {
      throw `fatal: no branch named '${DEFAULT_BRANCH_NAME}' found in this repo`;
    }
  }).filter(branchName =>
    // Get the common ancestor with the branch and master
    branchName !== DEFAULT_BRANCH_NAME && git(['merge-base', DEFAULT_BRANCH_NAME, branchName]).then(commonAncestorHash =>
      // Get the diff between the common ancestor and the branch tip
      git(['diff', `${commonAncestorHash}...${branchName}`]).then(diff => git(['patch-id'], diff)).then(branchPatchId =>
        // Iterate through all the commits to master since the ancestor
        git(['log', '--format=%H', `${commonAncestorHash}...${DEFAULT_BRANCH_NAME}`])
          .then(logOutput => logOutput ? logOutput.split('\n') : [])
          .map(getCommitDiffId, { concurrency: 10 })
          // If the patch for any commit to master since the ancestor is the same as the patch between the ancestor
          // and the branch tip, the branch can be deleted.
          .then(results => results.some(commitPatchId => commitPatchId === branchPatchId))
      )
    ),
    { concurrency: 1 }
  )
  .tap(branchNamesToDelete => branchNamesToDelete.length && git(['checkout', DEFAULT_BRANCH_NAME]))
  .mapSeries(branchName => git(['branch', '-D', branchName]))
  .mapSeries(stdout => console.log(stdout))
  .catch(err => console.error(err.cause || err));
