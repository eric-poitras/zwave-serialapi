const log = require('debug')('serialapi/action/send-data')
const fsm = require('../../utils/fsm')

function sendData (serialApi, command) {
  const sm = fsm({
    init: function (machine) {
      machine.txCount = 0
      machine.startTimeout('callbackTimeout', 65000)
      return { state: 'prepareSendData' }
    },
    states: {
      prepareSendData: {
        startSendData: function () {
          return { state: 'waitSendData', action: ['completeSendData', serialApi.sendData(command)] }
        }
      },
      waitSendData: {
        completeSendDataResolve: function (response, state) {
          if (response.success) {
            state.callbackId = state.meta.callbackId
            return { state: 'sendData' }
          } else {
            return { action: ['startSendDataBackoff'] }
          }
        },
        completeSendDataReject: function (e, state) {
          return { action: ['startSendDataBackoff'] }
        },
        startSendDataBackoff: function (data) {
          data.txCount++
          if (data.txCount >= 4) {
            return { state: 'done', action: ['failed', new Error('Failed sending data after 4 attempts')] }
          } else {
            this.startTimeout('completeSendDataBackoff', 500)
          }
        },
        completeSendDataBackoff: function () {
          return { action: ['completeSendData', serialApi.sendData(command)] }
        },
        callbackTimeout: function () {
          return { state: 'done', action: ['failed', new Error('Timed out after 65 seconds')] }
        }
      },
      sendData: {
        callbackTimeout: function () {
          this.pipePromise('sendAbort', serialApi.sendDataAbort())
          return { state: 'abort' }
        }
      },
      abort: {
        sendAbortResolve: function () {
          return { state: 'done', action: ['failed', new Error('Timed out after 65 seconds and abort data failed as well.')] }
        },
        sendAbortReject: function () {
          return { state: 'done', action: ['failed', new Error('Timed out after 65 seconds')] }
        }
      }

    }
  })

  return sm.promise
}

module.exports = sendData
