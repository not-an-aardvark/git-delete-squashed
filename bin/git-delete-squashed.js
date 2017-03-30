#!/usr/bin/env node

'use strict';

const childProcess = require('child_process');
const Promise = require('bluebird');
const execFile = Promise.promisify(childProcess.execFile);
const DEFAULT_BRANCH_NAME = 'master';

/**
 * Memoizes the result of calling a function
 * @param {Function} func A function that accepts one argument
 * @returns {Function} A function that memoizes `func`
 */
function memoize (func) {
  const memo = new Map();

  return arg => {
    if (!memo.has(arg)) {
      memo.set(arg, func(arg));
    }
    return memo.get(arg);
  };
}

/**
 * Calls `git` with the given arguments from the CWD
 * @param {string[]} args A list of arguments
 * @returns {Promise<string>} The output from `git`
 */
function git (args) {
  return execFile('git', ['--no-pager'].concat(args), { maxBuffer: Infinity })
    .then(stdoutBuffer => stdoutBuffer.toString().replace(/\n$/, ''));
}

/**
 * Gets a list of branch names in the current repo
 * @returns {Promise<string[]>} A list of local branch names
 */
function getBranchNames () {
  return git(['for-each-ref', 'refs/heads/', '--format=%(refname:short)']).then(result => result.split('\n'));
}

/**
 * Gets the hash of the common ancestor between two branches
 * @param {string} branchA A git branch name
 * @param {string} branchB A git branch name
 * @returns {Promise<string>} A commit hash of the latest common ancestor between the two branches
 */
function getCommonAncestorHash (branchA, branchB) {
  return git(['merge-base', branchA, branchB]);
}

/**
 * Gets the diff between two git refs
 * @param {string} fromRef A git reference representing the base of the diff
 * @param {string} toRef A git reference representing the head of the diff
 * @returns {Promise<string>} A git diff between the two refs
 */
function getDiff (fromRef, toRef) {
  return git(['diff', `${fromRef}...${toRef}`]);
}

/**
 * Gets a list of commits to master since a given commit
 * @param {string} fromRef A git reference. Must be an ancestor of `master`
 * @returns {Promise<string[]>} A list of commit hashes with commits to master since `fromRef`
 */
const getCommitsToMaster = memoize(fromRef => {
  return git(['log', '--format=%H', `${fromRef}...${DEFAULT_BRANCH_NAME}`])
    .then(logOutput => logOutput ? logOutput.split('\n') : []);
});

/**
 * Gets the diff of a single commit
 * @param {string} hash The commit hash
 * @returns {Promise<string>} The diff of the commit with the given hash
 */
const getCommitDiff = memoize(hash => git(['diff', `${hash}^`, hash]));

return getBranchNames().tap(branchNames => {
  if (branchNames.indexOf(DEFAULT_BRANCH_NAME) === -1) {
    throw `fatal: no branch named '${DEFAULT_BRANCH_NAME}' found in this repo`;
  }
}).filter(branchName => {
  if (branchName === DEFAULT_BRANCH_NAME) {
    return false;
  }

  // Get the common ancestor with the branch and master
  return getCommonAncestorHash(DEFAULT_BRANCH_NAME, branchName).then(commonAncestorHash =>
    // Get the diff between the common ancestor and the branch tip
    getDiff(commonAncestorHash, branchName).then(branchDiff =>
      // Iterate through all the commits to master since the ancestor
      getCommitsToMaster(commonAncestorHash)
        .map(getCommitDiff)
        // If the diff for any commit to master since the ancestor is the same as the diff between the ancestor
        // and the branch tip, the branch can be deleted.
        .map(commitDiff => commitDiff === branchDiff)
        .then(results => results.some(Boolean))
    )
  );
}).tap(branchNamesToDelete => {
  if (branchNamesToDelete.length) {
    return git(['checkout', DEFAULT_BRANCH_NAME]);
  }
}).mapSeries(branchName => git(['branch', '-D', branchName]))
  .mapSeries(stdout => console.log(stdout))
  .catch(err => console.error(err.cause || err));
