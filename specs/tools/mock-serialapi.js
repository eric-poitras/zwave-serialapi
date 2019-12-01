const { Subject, of } = require('rxjs')
const sinon = require('sinon')
const { expect } = require('chai')

function createMockSerialApi () {
  const pendingSendData = []

  function sendData (command) {
    const response = new Subject()
    pendingSendData.push({
      command,
      error: (err) => response.error(err),
      response: (result) => {
        result.callbacks = of(...[{ txStatus: 'OK' }])
        response.next(result)
        response.complete()
      }
    })
    return response.toPromise()
  }

  return {
    withNextRequest: (func) => func(pendingSendData.shift()),
    api: {
      sendData: sinon.spy(sendData)
    }
  }
}

module.exports = createMockSerialApi
