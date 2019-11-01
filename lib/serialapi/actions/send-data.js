const log = require('debug')('serialapi/action/send-data')

function sendData (serialApi, command) {
  let cleanup
  return new Promise((resolve, reject) => {
    let txCount = 0
    let callbackTimeout = setTimeout(onCallbackTimeout, 65000)
    let backoffTimeout
    let sendDataPromise
    let callbackId

    serialApi.on('sendData', onSendDataCallback)
    cleanup = function () {
      serialApi.off('sendData', onSendDataCallback)
    }

    startSendData()

    function message (message) {
      log('SendData: %s\nTry %d\n%j', message, txCount, command)
    }

    function startSendData () {
      message('Preparing to send data')
      sendDataPromise = serialApi.sendData(command).finally(() => {
        sendDataPromise = undefined
      }).then(receiveSendDataResponse, attemptRetry)
    }

    function receiveSendDataResponse (res) {
      if (res.success) {
        if (callbackTimeout) {
          message('Sending data')
          callbackId = res.meta.callbackId
        }
      } else {
        attemptRetry()
      }
    }

    function attemptRetry () {
      if (callbackTimeout) {
        if (txCount < 4) {
          txCount++
          message('Error sending data, backoff for 500ms then retry')
          backoffTimeout = setTimeout(() => {
            backoffTimeout = undefined
            startSendData()
          }, 500)
        } else {
          clearTimeout(callbackTimeout)
          callbackTimeout = undefined
          reject(new Error('sendData failed 4 time'))
        }
      }
    }

    function onCallbackTimeout () {
      callbackTimeout = undefined
      message('Send data operation timed-out after 65s')
      if (backoffTimeout) { clearTimeout(backoffTimeout) }
      (sendDataPromise || Promise.resolve())
        .catch(() => {})
        .then(() => serialApi.sendDataAbort())
        .then(() => reject(new Error('Operation timed out')), reject)
    }

    function onSendDataCallback (callback) {
      if (callbackTimeout && callbackId && callback.meta.callbackId === callbackId) {
        const { txStatus } = callback
        message(`Data sent with status: ${txStatus}`)
        if (txStatus === 'FAIL') {
          callbackId = undefined
          attemptRetry()
        } else {
          clearTimeout(callbackTimeout)
          resolve(txStatus)
        }
      }
    }
  }).finally(cleanup)
}

module.exports = sendData
