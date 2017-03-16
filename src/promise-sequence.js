module.exports = {
  handleInSequence(list, cb) {
    let promise = Promise.resolve();
    // Handle in sequence
    for (item of list) {
      ;(function(item) {
        promise = promise.then(() => cb(item))
      })(item)
    }
    return promise;
  }
}
