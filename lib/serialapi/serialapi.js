const { fromEvent } = require('rxjs')
const { map, filter, take, timeout } = require('rxjs/operators')
const createPromise = require('../utils/create-promise')
const createCallbackIdGen = require('../utils/callback-id-gen')
const createPort = require('./port')
const functions = require('./functions')
const log = require('debug')('serialapi/api')

function serialApi (params) {
  const port = createPort(params)
  const requests = []
  const callbackIdGenerator = createCallbackIdGen()
  let currentRequest

  function open () {
    return port.open().then(processRequests)
  }

  function close () {
    return port.close()
  }

  function send (params, options, funcMeta) {
    const callbackId = funcMeta.decodeCallback ? callbackIdGenerator.nextId() : undefined
    const request = funcMeta.encodeRequest(params, callbackId)
    const newRequest = createRequestHandler(result, port, request, options, funcMeta)
    requests.push(newRequest)
    requests.sort((a, b) => a.priority - b.priority)
    processRequests()
    return newRequest.response
  }

  function processRequests () {
    if (!currentRequest && requests.length > 0) {
      currentRequest = requests.shift()
      currentRequest.execute().finally(() => {
        currentRequest = undefined
        processRequests()
      })
    }
  }

  // This needs to move to a logging-only subscription
  // tap(req => log('ZW->HOST (REQ): %s\n%j', req.name, req.request))

  const frames = fromEvent(port, 'dataframe')
  const inboundRequests = frames.pipe(
    map(frame => functions.processCallback(functions.definitionsById[frame.funcId], frame)),
    filter(x => x !== undefined)
  )
  const inboundResponses = frames.pipe(
    map(frame => functions.processResponse(functions.definitionsById[frame.funcId], frame)),
    filter(x => x !== undefined)
  )

  const result = {
    open,
    close,
    send,
    isOpen: port.isOpen,
    frames,
    inboundRequests,
    inboundResponses
  }

  functions.definitions.filter(d => d.encodeRequest).forEach(funcMeta => {
    result[funcMeta.name] = (params, options) => send(params, options, funcMeta)
  })

  return result
}

function createRequestHandler (serialApi, port, request, options, funcMeta) {
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
        map(f => functions.processResponse(funcMeta, f, request.meta.callbackId)),
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
  serialApi
}
