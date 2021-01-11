#!/usr/bin/env node

"use strict";

const childProcess = require("child_process");
const Promise = require("bluebird");
let defaultBranch = process.env.DEFAULT_BRANCH;

/**
 * Calls `git` with the given arguments from the CWD
 * @param {string[]} args A list of arguments
 * @return {Promise<string>} The output from `git`
 */
function git(args) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn("git", args);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => (stdout += data));
    child.stderr.on("data", (data) => (stderr += data));

    child.on("close", (exitCode) => (exitCode ? reject(stderr) : resolve(stdout)));
  }).then((stdout) => stdout.replace(/\n$/, ""));
}

git(["for-each-ref", "refs/heads/", "--format=%(refname:short)"])
  .then((branchListOutput) => branchListOutput.split("\n"))
  .tap((branchNames) => {
    if (defaultBranch) {
      return;
    }
    // guess default branch
    if (branchNames.includes("master")) {
      defaultBranch = "master";
    } else if (branchNames.includes("main")) {
      defaultBranch = "main";
    } else {
      throw new Error(`fatal: no branch named '${defaultBranch}' found in this repo`);
    }
  })
  .filter((branchName) =>
    // Get the common ancestor with the branch and master
    Promise.join(
      git(["merge-base", defaultBranch, branchName]),
      git(["rev-parse", `${branchName}^{tree}`]),
      (ancestorHash, treeId) =>
        git(["commit-tree", treeId, "-p", ancestorHash, "-m", `Temp commit for ${branchName}`])
    )
      .then((danglingCommitId) => git(["cherry", defaultBranch, danglingCommitId]))
      .then((output) => output.startsWith("-"))
  )
  .tap((branchNamesToDelete) => branchNamesToDelete.length && git(["checkout", defaultBranch]))
  .mapSeries((branchName) => git(["branch", "-D", branchName]))
  .mapSeries((stdout) => console.log(stdout))
  .catch((err) => console.error(err.cause || err));
