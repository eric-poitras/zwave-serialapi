const { defer } = require('rxjs')
const { retryWhen, delay, map, flatMap } = require('rxjs/operators')
const log = require('debug')('serialapi/action/send-data')

function sendData (serialApi, command) {
  let count = 0
  log('Sending data: %j', command)
  return defer(() => serialApi.sendData(command)).pipe(
    flatMap(res => {
      if (!res.success) {
        throw new Error('sendData returned false.')
      }
      return res.callbacks
    }),
    map(cb => {
      log('Received callback: %j', cb)
      if (cb.txStatus === 'FAIL') {
        throw new Error('sendData returned a FAIL status.')
      }
      return cb
    }),
    retryWhen(errors => errors.pipe(
      map(error => {
        const willRetry = (count++) < 3
        log('Error occured while sending data: %s. Will retry: %s.', error, willRetry)
        if (!willRetry) {
          throw new Error('Retried 3 times to send data without success.')
        }
      }),
      delay(1500)
    ))
  ).toPromise()
}

module.exports = sendData
