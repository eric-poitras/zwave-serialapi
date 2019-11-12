const createPromise = require('../utils/create-promise')
const consts = require('../serialapi/consts')

function createRequest (createParams) {
  const { port, callbackIdProvider, log } = createParams
  const { encodeRequest, handleResponse, handleCallback, timeout, params, priority } = Object.assign(
    {
      priority: 0,
      timeout: 6000
    },
    createParams.request
  )

  const clientResponse = createPromise()

  function execute () {
    const callbackId = handleCallback ? callbackIdProvider() : undefined
    const request = encodeRequest(params, callbackId)
    const writePromise = port.open().then(() => port.write({ funcId: request.meta.funcId, params: request.meta.data }))
    const responsePromise = responseHandler(handleResponse, timeout, port, request.meta.callbackId)

    log('HOST->ZW (REQ): %j', request)
    return Promise.all([writePromise, responsePromise]).then((res) => {
      const response = res[1]
      if (handleResponse) {
        log('ZW->HOST (RES): %j', response)
      }
      clientResponse.resolve(response)
    }, clientResponse.reject).catch((err) => log('REQUEST ERROR %s', err))
  }
  return {
    execute,
    params,
    priority,
    response: clientResponse.promise
  }
}

function responseHandler (responseHandler, timeout, port, callbackId) {
  if (!responseHandler) {
    return Promise.resolve()
  } else {
    return new Promise((resolve, reject) => {
      port.on('dataframe', onResponse)
      const responseTimeout = setTimeout(onTimeout, timeout)
      function onResponse (frame) {
        if (frame.type === consts.RESPONSE) {
          const response = responseHandler(frame, callbackId)
          if (response) {
            resolve(response)
            clearTimeout(responseTimeout)
            port.off('dataframe', onResponse)
          }
        }
      }
      function onTimeout () {
        reject(new Error(`Timed out after ${timeout}ms waiting for timeout.`))
        port.off('dataframe', onResponse)
      }
    })
  }
}

module.exports = {
  createRequest
}
