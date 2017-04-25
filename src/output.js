var ProgressBar = require('node-progress-bars');

class PrBar {
  constructor(number) {
    this.data = {
      number: number,
      status: 'new',
      action: '?',
      description: '',
    }
    this.bar = new ProgressBar({
      schema: this.getSchema()
    })

    // Render initial bar
    this.render()
  }

  getStatusColor() {
    switch (this.data.status) {
      case 'new':
        return 'grey'
      case 'ok':
        return 'green'
      case 'fail':
        return 'red'
      case 'unknown':
        return 'yellow'
    }
  }

  getSchema() {
    const statusColor = this.getStatusColor()
    return `:number.white \t◉.${statusColor} :action :description`
  }

  render() {
    this.bar.tick({
      number: this.data.number,
      action: this.getActionIcon(this.data.action),
      description: this.data.description
    })
  }

  setStatus(status) {
    if (this.data.status !== status) {
      this.data.status = status
      this.bar.setSchema(this.getSchema())
      this.render()
    }
  }

  getActionIcon(action) {
    switch(action) {
      case 'waiting':
        return '☐';
      case 'done':
        return '☑';
      case 'failed':
        return '☒';
    }
  }

  setAction(action) {
    this.data.action = action;
    this.render()
  }
}

class Output {
  constructor() {
    this.bars = {};
    this.head = this._initHead()
    this.status = 'idle'
  }

  _initHead() {
    return new ProgressBar({
      schema: ':status :progress'
    })
  }

  setStatus(status) {
    switch (status.toLowerCase()) {
      case 'idle':
        this.status = 'idle'
        this.head.tick({status: 'Idle', progress: ''})
        break;
      case 'loading':
        this.status = 'loading'
        this.head.tick({status: 'Loading', progress: ''})
        break;
      case 'rebasing':
        this.status = 'rebasing'
        this.head.tick({status: 'Rebasing', progress: 'x of x'})
        break;
    }
  }

  addPRs(prs) {
    for (let pr of prs) {
      if (!(pr.number in this.bars)) {
        this.bars[pr.number] = new PrBar(pr.number)
      }

      const prBar = this.bars[pr.number]
      if (pr.mergeable === true) {
        prBar.setStatus('ok')
        prBar.setAction('waiting')
      } else if (pr.mergeable === false) {
        prBar.setStatus('fail')
      } else {
        prBar.setStatus('unknown')
      }
    }
  }

  setPRAction(number, action) {
    if (number in this.bars) {
      this.bars[number].setAction(action)
    }
  }
}

module.exports = Output
