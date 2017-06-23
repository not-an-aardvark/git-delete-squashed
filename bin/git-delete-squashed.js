#!/usr/bin/env node

'use strict';

const childProcess = require('child_process');
const Promise = require('bluebird');
const DEFAULT_BRANCH_NAME = 'master';

/**
 * Calls `git` with the given arguments from the CWD
 * @param {string[]} args A list of arguments
 * @returns {Promise<string>} The output from `git`
 */
function git (args) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn('git', args);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => stdout += data);
    child.stderr.on('data', data => stderr += data);

    child.on('close', exitCode => exitCode ? reject(stderr) : resolve(stdout));
  }).then(stdout => stdout.replace(/\n$/, ''));
}

git(['for-each-ref', 'refs/heads/', '--format=%(refname:short)'])
  .then(branchListOutput => branchListOutput.split('\n'))
  .tap(branchNames => {
    if (branchNames.indexOf(DEFAULT_BRANCH_NAME) === -1) {
      throw `fatal: no branch named '${DEFAULT_BRANCH_NAME}' found in this repo`;
    }
  }).filter(branchName =>
    // Get the common ancestor with the branch and master
    Promise.join(
      git(['merge-base', DEFAULT_BRANCH_NAME, branchName]),
      git(['rev-parse', `${branchName}^{tree}`]),
      (ancestorHash, treeId) => git(['commit-tree', treeId, '-p', ancestorHash, '-m', `Temp commit for ${branchName}`])
    )
      .then(danglingCommitId => git(['cherry', DEFAULT_BRANCH_NAME, danglingCommitId]))
      .then(output => output.startsWith('-'))
  )
  .tap(branchNamesToDelete => branchNamesToDelete.length && git(['checkout', DEFAULT_BRANCH_NAME]))
  .mapSeries(branchName => git(['branch', '-D', branchName]))
  .mapSeries(stdout => console.log(stdout))
  .catch(err => console.error(err.cause || err));
