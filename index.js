'use strict';

const Slack = require('./src/slack')
const GithubService = require('./src/github-service')
const GithubData = require('./src/github-data')
const PRHandler = require('./src/pr-handler')
const Output = require('./src/output')
const { handleInSequence } = require('./src/promise-sequence')
const NOTIFICATIONS_FILE = `${__dirname}/notifications.json`
let config = null

if (process.argv.length < 3) {
  throw new Error('3rd argument should be config file name')
}

try {
  config = require(process.argv[2])
} catch (e) {
  throw new Error(`Can't import config from ${process.argv[2]}. Error: ${e}`)
}

const output = new Output()

const slack = new Slack({
  githubToSlackMap: config.GITHUB_TO_SLACK_USERNAMES,
  webHookUrl: config.SLACK_URL,
})

const githubService = new GithubService({
  urlPRs: `https://${config.GITHUB_DOMAIN}/repos/${config.GITHUB_REPO}/pulls`,
  urlIssue: `https://${config.GITHUB_DOMAIN}/repos/${config.GITHUB_REPO}/issues`,
  urlBranches: `https://${config.GITHUB_DOMAIN}/repos/${config.GITHUB_REPO}/branches`,
  authToken: config.GITHUB_AUTH_TOKEN,
})

const githubData = new GithubData({
  validLabels: config.VALID_LABELS,
  ignoreWhenText: config.IGNORE_WITH_TEXT,
  mandatoryText: config.MANDATORY_TEXT,
})

const prHandler = new PRHandler({
  baseDir: __dirname,
  notificationsFile: NOTIFICATIONS_FILE,
  slack: slack,
})

function print(data) {
  for (let item of data) {
    console.log({
      number: item.number,
      author: item.author,
      mergeable: item.mergeable,
    })
  }
  return data;
}

function handleOnePR(pr) {
  if (pr.mergeable === true) {
    if (prHandler.needsRebase(pr)) {
      return prHandler.rebasePR(pr)
        .catch(() => {
          // TODO
          // console.log(`Failed to rebase ${pr.headBranch}`)
          output.setPRAction(pr.number, 'failed')
          return prHandler.logUnmergeablePR(pr);
        })
    } else {
      // TODO
      // console.log(`Branch ${pr.headBranch} and its base ${pr.baseBranch} didn't change since last check`)
    }
  } else if (pr.mergeable === false) {
    return prHandler.logUnmergeablePR(pr);
  } else {
    // TODO
    // console.log('Mergeable status is null, probably master was updated and GitHub is running checks')
  }

  return pr
}

const nextRun = () => setTimeout(runSynchronization, config.CHECKS_DELAY)

const runSynchronization = () => {
  // const prsData = githubService.getFormatedPRs()

  // return prsData
  return Promise.resolve()
    .then(() => output.setStatus('loading'))
    .then(() => githubService.getFormatedPRs())
    .then((data) => githubData.filterData(data))
    .then((data) => githubService.getMergeabilityOfAll(data))
    // .then(print)
    .then((data) => {output.setStatus('rebasing'); return data})
    .then((data) => {output.addPRs(data); return data})
    // .then(print)
    .then((data) => handleInSequence(data, handleOnePR))
    .catch((e) => {console.log('error', e.stdout ? e.stdout : e)})
    .then(() => output.setStatus('idle'))
    // finally
    .then(nextRun)
    .catch(nextRun)
}

runSynchronization()
