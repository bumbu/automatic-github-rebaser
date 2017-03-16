class GithubData {
  constructor(config) {
    this.config = Object.assign({
      validLabels: [],
      ignoreWhenText: [],
      mandatoryText: [],
    }, config);
  }

  filterData(data) {
    return data
      // Should not be locked
      .filter((pr) => !pr.locked)
      // Should have at least one label, and all labels should be valid labels
      .filter((pr) => {
        let validLabelsCount = 0;
        for (let label of pr.labels) {
          if (this.config.validLabels.indexOf(label) !== -1) {
            validLabelsCount += 1;
          }
        }

        return validLabelsCount > 0 && validLabelsCount === pr.labels.length;
      })
      // Should not contain ignoring text
      .filter((pr) => {
        let containsIgnorintText = false;
        for (let needle of this.config.ignoreWhenText) {
          if (pr.title.indexOf(needle) !== -1 || pr.body.indexOf(needle) !== -1) {
            containsIgnorintText = true;
            break;
          }
        }

        return !containsIgnorintText;
      })
      // Should contain mandatory text
      .filter((pr) => {
        let containsMandatoryText = true;
        for (let needle of this.config.mandatoryText) {
          if (pr.title.indexOf(needle) === -1 && pr.body.indexOf(needle) === -1) {
            containsMandatoryText = false;
            break;
          }
        }

        return containsMandatoryText;
      })
  }
}

module.exports = GithubData
