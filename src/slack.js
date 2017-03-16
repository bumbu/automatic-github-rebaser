const rp = require('request-promise');

class Slack {
  constructor(config) {
    this.config = Object.assign({
      githubToSlackMap: {},
      webHookUrl: null,
    }, config);
  }

  getSlackNick(githubNick) {
    if (githubNick in this.config.githubToSlackMap) {
      return this.config.githubToSlackMap[githubNick];
    } else {
      return githubNick.toLowerCase();
    }
  }

  postToSlack(message) {
    return rp({
      method: 'POST',
      uri: this.config.webHookUrl,
      body: {
        text: message,
        link_names: 1,
        username: "Rebaser friend",
        // icon_emoji: ":ghost:",
      },
      json: true,
    })
  }
}

module.exports = Slack
