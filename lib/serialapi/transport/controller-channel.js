const { Subject, defer } = require('rxjs')
const { retryWhen, delay, map, mergeMap, first, tap } = require('rxjs/operators')
const log = require('debug')('serialapi/transport/controller-channel')

function controllerChannel (serialApi) {
  const commands = new Subject()
  const events = new Subject()

  function send (command) {
    const response = new Subject()
    const commandEntry = {
      command,
      response
    }
    commands.next(commandEntry)
    return response.toPromise()
  }

  commands.pipe(
    mergeMap(command => sendData(serialApi, command.command)
      .then(result => [result, command.response])
    /* eslint-disable prefer-promise-reject-errors */
      .catch(err => Promise.reject([err, command.response]))
    /* eslint-enable prefer-promise-reject-errors */
    , 1)
  ).subscribe(res => {
    res[1].next(res[0])
    res[1].complete()
  }, err => err[1].error(err[0]))

  return {
    send,
    events
  }
}

function sendData (serialApi, command) {
  let count = 0
  log('Sending data: %j', command)
  return defer(() => serialApi.sendData(command)).pipe(
    mergeMap(res => {
      if (!res.success) {
        throw new Error('sendData returned false')
      }
      return res.callbacks
    }),
    first(),
    map(cb => {
      log('Received callback: %j', cb)
      if (cb.txStatus === 'FAIL') {
        throw new Error('sendData returned a FAIL status')
      }
      return cb
    }),
    retryWhen(errors => errors.pipe(
      map(error => {
        const willRetry = (count++) < 3
        log('Error occured while sending data: %s. Will retry: %s.', error.message, willRetry)
        if (!willRetry) {
          throw new Error('Retried 3 times to send data without success.')
        } else {
          return error
        }
      }),
      delay(1500)
    ))
  ).toPromise()
  // TODO Add cancellation
}

module.exports = {
  controllerChannel,
  sendData
}
