const spawn = require('child-process-promise').spawn;
const jsonfile = require('jsonfile');

class PRHandler {
  constructor(config) {
    this.config = Object.assign({
      baseDir: null,
      slack: null,
      notificationsFile: null,
    }, config);
  }

  rebasePR(pr) {
    return spawn('bash', [`${this.config.baseDir}/rebase.sh`, pr.baseBranch, pr.headBranch], { capture: [ 'stdout', 'stderr' ]}).then(result => {
      // LOG to console
      console.log(result.stdout.toString())
      this._cacheHandledPR(pr)
      return pr;
    })
  }

  needsRebase(pr) {
    const records = jsonfile.readFileSync(this.config.notificationsFile, {throws: false}) || {};
    if (pr.number in records && records[pr.number].headSha === pr.headSha && records[pr.number].baseSha === pr.baseSha) {
      return false;
    } else {
      return true;
    }
  }

  logUnmergeablePR(pr) {
    const records = jsonfile.readFileSync(this.config.notificationsFile, {throws: false}) || {};

    if (!this.needsRebase(pr)) {
      console.log('Already notified, do nothing');
      return pr
    } else {
      const message = `Hey @${this.config.slack.getSlackNick(pr.author)}, PR <${pr.url}|#${pr.number} (${pr.headBranch})> is out of date and can't be automatically rebased`;

      return this.config.slack.postToSlack(message)
        .then(() => {
          console.log(`Notified on Slack that branch ${pr.headBranch} is out of date and can't be automatically rebased`);
          this._cacheHandledPR(pr)
          return pr
        })
        .catch(() => {
          console.log(`Slack notification for branch ${pr.headBranch} failed`);
        })
    }
  }

  _cacheHandledPR(pr) {
    const records = jsonfile.readFileSync(this.config.notificationsFile, {throws: false}) || {};
    const newRecords = Object.assign({}, records, {
      [pr.number]: {
        headSha: pr.headSha,
        baseSha: pr.baseSha,
      }
    })
    jsonfile.writeFileSync(this.config.notificationsFile, newRecords, {spaces: 2})
  }
}

module.exports = PRHandler
