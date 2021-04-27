#!/usr/bin/env node

'use strict';

const childProcess = require('child_process');
const Promise = require('bluebird');
const DEFAULT_BRANCH_NAME = 'master';
const selectedBranchName = process.argv[1] || DEFAULT_BRANCH_NAME;

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
    if (branchNames.indexOf((selectedBranchName)) === -1) {
      throw `fatal: no branch named '${selectedBranchName}' found in this repo`;
    }
  }).filter(branchName =>
    // Get the common ancestor with the branch and master
    Promise.join(
      git(['merge-base', selectedBranchName, branchName]),
      git(['rev-parse', `${branchName}^{tree}`]),
      (ancestorHash, treeId) => git(['commit-tree', treeId, '-p', ancestorHash, '-m', `Temp commit for ${branchName}`])
    )
      .then(danglingCommitId => git(['cherry', selectedBranchName, danglingCommitId]))
      .then(output => output.startsWith('-'))
  )
  .tap(branchNamesToDelete => branchNamesToDelete.length && git(['checkout', selectedBranchName]))
  .mapSeries(branchName => git(['branch', '-D', branchName]))
  .mapSeries(stdout => console.log(stdout))
  .catch(err => console.error(err.cause || err));
