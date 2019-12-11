const { Subject, of } = require('rxjs')
const sinon = require('sinon')
const { expect } = require('chai')

function createMockSerialApi () {
  const pendingSendData = []

  function sendData (command, callbacks) {
    const response = new Subject()
    pendingSendData.push({
      command,
      error: (err) => response.error(err),
      response: (result, callback) => {
        const callbacks = callback ? of(...[callback]) : of()
        Object.defineProperty(result, 'callbacks', { value: callbacks })
        response.next(result)
        response.complete()
      }
    })
    return response.toPromise()
  }

  return {
    withNextRequest: (func) => func(pendingSendData.shift()),
    getRequestCount: () => pendingSendData.length,
    api: {
      sendData: sinon.spy(sendData)
    }
  }
}

module.exports = createMockSerialApi
