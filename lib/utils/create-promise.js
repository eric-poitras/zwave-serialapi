function createPromise () {
  let thisResolve, thisReject
  const promise = new Promise((resolve, reject) => {
    thisResolve = resolve; thisReject = reject
  })
  return {
    promise,
    resolve: thisResolve,
    reject: thisReject
  }
}

module.exports = createPromise
