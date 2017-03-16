'use strict';

const Slack = require('./src/slack')
const GithubService = require('./src/github-service')
const GithubData = require('./src/github-data')
const PRHandler = require('./src/pr-handler')
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

const slack = new Slack({
  githubToSlackMap: {
    alexandrt: 'bumbu',
    michalm: 'michalm',
    richards: 'richards',
    FrancescoD: 'francescod',
    vitalijk: 'vitalijk',
    sengjeal: 'sengjea',
    danieleu: 'danieleu',
    shays: 'shays',
    joshuae: 'josha',
    BarrieD: 'barried',
  },
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
          console.log(`Failed to rebase ${pr.headBranch}`)
          return prHandler.logUnmergeablePR(pr);
        })
    } else {
      console.log(`Branch ${pr.headBranch} and its base ${pr.baseBranch} didn't change since last check`)
    }
  } else if (pr.mergeable === false) {
    return prHandler.logUnmergeablePR(pr);
  } else {
    console.log('Mergeable status is null, probably master was updated and GitHub is running checks')
  }

  return pr
}

const nextRun = () => setTimeout(runSynchronization, config.CHECKS_DELAY)

const runSynchronization = () => {
  const prsData = githubService.getFormatedPRs()

  return prsData
    .then((data) => githubData.filterData(data))
    .then((data) => githubService.getMergeabilityOfAll(data))
    .then(print)
    .then((data) => handleInSequence(data, handleOnePR))
    .catch((e) => {console.log('error', e.stdout ? e.stdout : e)})
    // finally
    .then(nextRun)
    .catch(nextRun)
}

runSynchronization()
