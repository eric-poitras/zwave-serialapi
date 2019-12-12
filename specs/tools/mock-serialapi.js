const { Subject, of, isObservable } = require('rxjs')
const sinon = require('sinon')

function createMockSerialApi () {
  const pendingSendData = []

  function sendData (command) {
    const response = new Subject()
    pendingSendData.push({
      command,
      error: (err) => response.error(err),
      response: (result, callback) => {
        const callbacks = buildCallbackObservable(callback)
        Object.defineProperty(result, 'callbacks', { value: callbacks })
        response.next(result)
        response.complete()
      }
    })
    return response.toPromise()
  }

  function sendDataAbort () {
    return Promise.resolve()
  }

  return {
    withNextRequest: (func) => func(pendingSendData.shift()),
    getRequestCount: () => pendingSendData.length,
    api: {
      sendData: sinon.spy(sendData),
      sendDataAbort: sinon.spy(sendDataAbort)
    }
  }
}

function buildCallbackObservable (callback) {
  if (callback) {
    return isObservable(callback) ? callback : of(...[callback])
  } else {
    return of()
  }
}

module.exports = createMockSerialApi
