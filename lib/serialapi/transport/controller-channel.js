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
  const state = {
    count: 0,
    abort: false,
    expiration: new Date(Date.now() + 65000)
  }
  log('Sending data: %j', command)
  return prepareSendData(serialApi, state, command).pipe(
    sendingData(state),
    retrySend(state),
    abortSendIfNeeded(serialApi, state)
  ).toPromise()
}

function prepareSendData (serialApi, state, command) {
  return defer(() => serialApi.sendData(command)).pipe(
    mergeMap(res => {
      if (!res.success) {
        throw new Error('SendData returned false')
      }
      state.abort = true
      return res.callbacks
    }),
    first()
  )
}

function sendingData (state) {
  return source => source.pipe(
    map(cb => {
      log('Received callback: %j', cb)
      if (cb.txStatus === 'FAIL') {
        state.abort = false
        throw new Error('SendData callbak returned a FAIL status')
      }
      return cb
    })
  )
}

function retrySend (state) {
  return source => source.pipe(
    retryWhen(errors => errors.pipe(
      mergeMap(error => {
        const willRetry = (state.count++) < 4
        log('Error occured while sending data: %s. Will retry: %s.', error.message, willRetry)
        return (willRetry) ? of(error) : throwError(error)
      }),
      delay(500)
    ))

  )
}

function abortSendIfNeeded (serialApi, state) {
  return source => source.pipe(
    timeout(state.expiration),
    catchError(err => concat(
      defer(() => state.abort ? serialApi.sendDataAbort() : Promise.resolve()),
      throwError(err)
    ))
  )
}

module.exports = {
  controllerChannel,
  sendData
}
