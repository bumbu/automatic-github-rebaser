# Automatic Github Rebaser

Automatically rebases outdated PR branches.
You can define rules to ignore certain PRs based on PR title, body or labels.

## Instalation and running

* Ensure you have `bash`, `node` (version 5 or later) and `npm`
* Ensure you can pull and force-push into your repo
* Clone/download folder and run `npm install`
* Make a copy of `config.example.json` and fill in the data
* Clone your repo
* `cd` into your repo
* Run `node path/to/rebaser path/to/config
* Leave it running.

Alternatively you can run it using pm2 (or other process managers) so that it gets restarted in case of failure.

For example if you cloned the rebaser into `/root/rebaser` and your repo into `/root/my-best-code` and your config file is in `/root/rebaser/config.best.json` then you should do:
* `cd /root/my-best-code`
* `node /root/rebaser /root/rebaser/config.best.json`

## Available rules

### PR labels

If you set the `VALID_LABELS` then the script will run only for the PRs that contain at least one valid label, and all PR labels are valid labels.

If you don't set the `VALID_LABELS` - all PRs will be ignored.

### PR title and description

If you set the `MANDATORY_TEXT` then only the PRs that contain all required pieces of text (case-insensitive) will pass through.

If you don't set the `MANDATORY_TEXT` - all PRs will be passed through.

If you set the `IGNORE_WITH_TEXT` then only the PRs that don't contain any of the provided pieces of text (case-insensitive) will pass through.

If you don't set the `IGNORE_WITH_TEXT` - all PRs will be passed through.

### Github usernames to Slack usernames

If your Github usernames don't match Slack usernames then you can configure these mappings through `GITHUB_TO_SLACK_USERNAMES` config.

## How does it work

* Request all available PRs from Github. Makes 3 separate requests: PRs, issues (to get labels) and branches (to get base branch current head)
* Filter locked PRs
* Filter PRs by `VALID_LABELS` config
* Filter PRs by `MANDATORY_TEXT` config
* Filter PRs by `IGNORE_WITH_TEXT` config
* Check `mergeable` status (provided by Github):
    * If _none_ then ignore as Github is still checking the mergeability status
    * If `false` then logs that the PRs branch is non-rebaseable
    * If `true` then:
        * If a rebase is necessary then tries to perform a rebase and push it into the upstream. If a rebase is to fail then logs that the PRs branch is non-rebaseable

 You get just one log message per a unique branch head and base branch head. And only if that branch is not rebaseable.

 Logs are shown in the console.
![image](https://cloud.githubusercontent.com/assets/171178/24015385/40a83c26-0a80-11e7-9055-1b098d6b41e4.png)

Failed rebases are sent to Slack
![Unrebaseable PR Slack notification](https://cloud.githubusercontent.com/assets/171178/24015281/fa7ec36e-0a7f-11e7-92ad-c3fa00f55fdc.png)
