const rp = require('request-promise');

const _parseLinkHeader = (str) => {
  const links = {}
  const linksList = str.split(',').filter(e => e.trim())

  for (let linkStr of linksList) {
    const match = linkStr.match(/<([^\]]+)>; rel="(\w+)"/);
    if (match && match.length > 2) {
      links[match[2]] = match[1];
    }
  }

  return links;
}

const _requestPromiseTransform = (body, xhrResponse, resolveWithFullResponse) => {
  const response = {
    data: null,
    links: 'link' in xhrResponse.headers ? _parseLinkHeader(xhrResponse.headers.link) : {},
  }

  if (xhrResponse.headers['content-type'] === 'application/json') {
    response.data = JSON.parse(body);
  } else {
    response.data = body;
  }

  return response
}

const _loadPaginatedData = (config, prevData = []) => {
  return rp(config)
    .then(({data, links}) => {
      if ('next' in links) {
        config.qs = {};
        config.uri = links.next;
        return _loadPaginatedData(config, prevData.concat(data))
      } else {
        return prevData.concat(data)
      }
    })
}

class GithubData {
  constructor(config) {
    this.config = config;
  }

  getFormatedPRs() {
    const prs = this._getPRs().then(this._formatPRs);
    const issues = this._getIssues().then(this._formatIssues)
    const branches = this._getBranches().then(this._formatBranches)
    const mergedData = Promise.all([prs, issues, branches]).then(this._mergePRsAndIssues)
    return mergedData
  }

  _getConfig(url) {
    return {
      uri: url,
      qs: {
        state: 'open',
      },
      headers: {
        'Authorization': `token ${this.config.authToken}`,
      },
      json: true,
      transform: _requestPromiseTransform,
    }
  }

  _getPRs() {
    return _loadPaginatedData(this._getConfig(this.config.urlPRs));
  }

  _formatPRs (prs) {
    const formatedList = [];
    for (let pr of prs) {
      formatedList.push({
        state: pr.state,
        number: pr.number,
        locked: pr.locked,
        author: pr.user.login,
        url: pr.html_url,
        title: pr.title.toLowerCase(),
        body: pr.body.toLowerCase(),
        headSha: pr.head.sha,
        baseSha: pr.base.sha,
        headBranch: pr.head.ref,
        baseBranch: pr.base.ref,
      })
    }
    return formatedList;
  }

  _getIssues() {
    return _loadPaginatedData(this._getConfig(this.config.urlIssue));
  }

  _formatIssues (issues) {
    const formatedMap = {};
    for (let issue of issues) {
      formatedMap[issue.number] = {
        number: issue.number,
        labels: issue.labels.map((label) => label.name),
      }
    }
    return formatedMap;
  }

  _getBranches() {
    return _loadPaginatedData(this._getConfig(this.config.urlBranches));
  }

  _formatBranches(branches) {
    const formatedMap = {};
    for (let branch of branches) {
      formatedMap[branch.name] = {
        name: branch.name,
        sha: branch.commit.sha,
      }
    }
    return formatedMap;
  }

  _mergePRsAndIssues(data) {
    const [prsList, issuesMap, branchesMap] = data;
    const mergedData = prsList.map((pr) => Object.assign(
      {},
      pr,
      issuesMap[pr.number],
      { baseSha: branchesMap[pr.baseBranch].sha }
    ))
    return mergedData;
  }

  _setMergeability(pr) {
    return rp(this._getConfig(`${this.config.urlPRs}/${pr.number}`))
      .then((prData) => {
        return Object.assign({}, pr, {mergeable: prData.data.mergeable});
      })
  }

  getMergeabilityOfAll(prs) {
    const promises = [];
    for (let pr of prs) {
      promises.push(this._setMergeability(pr));
    }
    return Promise.all(promises);
  }
}

module.exports = GithubData
