const createPromise = require('../utils/create-promise')
const { processResponse } = require('./functions')
const { filter, timeout, take, map } = require('rxjs/operators')

function createRequest (serialApi, port, log, request, options, funcMeta) {
  options = Object.assign(
    {
      priority: 0,
      timeout: 6000
    },
    options
  )

  const clientResponse = createPromise()

  function execute () {
    const writePromise = port.open().then(() => port.write({ funcId: request.meta.funcId, params: request.meta.data }))
    const responsePromise = funcMeta.decodeResponse
      ? serialApi.frames.pipe(
        map(f => processResponse(funcMeta, f, request.meta.callbackId)),
        filter(f => f !== undefined),
        take(1),
        timeout(options.timeout)
      ).toPromise() : Promise.resolve()

    log('HOST->ZW (REQ): %j', request)
    return Promise.all([writePromise, responsePromise]).then((res) => {
      const response = res[1]
      if (funcMeta.decodeResponse) {
        log('ZW->HOST (RES): %j', response)
      }
      clientResponse.resolve(response)
    }, clientResponse.reject).catch((err) => log('REQUEST ERROR %s', err))
  }
  return {
    execute,
    options,
    request,
    response: clientResponse.promise
  }
}

module.exports = {
  createRequest
}
