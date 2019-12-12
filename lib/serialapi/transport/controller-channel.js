const { Subject, defer, of, concat, throwError } = require('rxjs')
const { retryWhen, delay, map, mergeMap, first, timeout, catchError } = require('rxjs/operators')
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
  let abort = false
  const expiration = new Date(Date.now() + 65000)
  log('Sending data: %j', command)
  return defer(() => serialApi.sendData(command)).pipe(
    mergeMap(res => {
      if (!res.success) {
        throw new Error('SendData returned false')
      }
      abort = true
      return res.callbacks
    }),
    first(),
    map(cb => {
      log('Received callback: %j', cb)
      if (cb.txStatus === 'FAIL') {
        abort = false
        throw new Error('SendData callbak returned a FAIL status')
      }
      return cb
    }),
    retryWhen(errors => errors.pipe(
      mergeMap(error => {
        const willRetry = (count++) < 4
        log('Error occured while sending data: %s. Will retry: %s.', error.message, willRetry)
        return (willRetry) ? of(error) : throwError(error)
      }),
      delay(500)
    )),
    timeout(expiration),
    catchError(err => concat(
      defer(() => abort ? serialApi.sendDataAbort() : Promise.resolve()),
      throwError(err)
    ))
  ).toPromise()
}

module.exports = {
  controllerChannel,
  sendData
}
