const consts = require('./consts')

function createPromise () {
  let thisResolve, thisReject
  const promise = new Promise((resolve, reject) => {
    thisResolve = resolve; thisReject = reject
  })
  return {
    promise,
    resolve: thisResolve,
    reject: thisReject
  }
}

/**
 * @param {*} port
 * @param {*} request
 */
function createRequest (createParams) {
  const { port, callbackIdProvider, log } = createParams
  const { encodeRequest, handleResponse, handleCallback, timeout, params, priority } = Object.assign(
    {
      priority: 0,
      timeout: 6000
    },
    createParams.request
  )

  const response = createPromise()

  function execute () {
    const callbackId = handleCallback ? callbackIdProvider() : undefined
    const request = encodeRequest(params, callbackId)
    const write = port.open().then(() => port.write({ funcId: request.meta.funcId, params: request.meta.data }))
    const response = responseHandler(handleResponse, timeout, port, request.meta.callbackId)

    log('HOST->ZW (REQ): %j', request)
    Promise.all([write, response]).then((res) => {
      const response = res[1]
      if (handleResponse) {
        log('ZW->HOST (RES): %j', response)
      }
      response.resolve(response)
    }, response.reject)
  }
  return {
    execute,
    params,
    priority,
    response: response.promise
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

module.exports = createRequest
