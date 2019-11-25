const { fromEvent, Subject } = require('rxjs')
const { map, filter, take, timeout, distinctUntilChanged, tap } = require('rxjs/operators')
const createPromise = require('../utils/create-promise')
const createCallbackIdGen = require('../utils/callback-id-gen')
const createHmac = require('./port')
const log = require('debug')('serialapi/api')
const { processCallback, processResponse, buildDefinitionsLookups } = require('./serialapi-utils')
const functions = buildDefinitionsLookups(require('./functions'))

function serialApi (params) {
  const hmac = createHmac(params)
  const requests = []
  const callbackIdGenerator = createCallbackIdGen()
  const frames = fromEvent(hmac, 'dataframe')
  const outboundRequests = new Subject()
  const inboundRequests = new Subject()
  const inboundResponses = new Subject()
  const internalApi = {
    write,
    inboundRequests,
    inboundResponses,
    outboundRequests
  }
  let currentRequest

  const subscriptions = []
  hmac.isOpen.pipe(distinctUntilChanged()).subscribe(value => {
    log(`hmac open state changed to ${value}`)
    if (value) {
      subscriptions.push(frames.pipe(
        map(frame => processCallback(functions.definitionsById[frame.funcId], frame)),
        filter(x => x !== undefined)
      ).subscribe(inboundRequests))
      subscriptions.push(frames.pipe(
        map(frame => processResponse(functions.definitionsById[frame.funcId], frame)),
        tap(f => log('Response decoded: %j', f)),
        filter(x => x !== undefined)
      ).subscribe(inboundResponses))
      subscriptions.push(outboundRequests.subscribe(req => log('HOST->ZW (REQ):\n  - Meta: %j\n  - Req : %j', req.meta, req)))
      subscriptions.push(inboundRequests.subscribe(req => log('ZW->HOST (REQ):\n  - Meta: %j\n  - Req : %j', req.meta, req)))
      subscriptions.push(inboundResponses.subscribe(req => log('ZW->HOST (RES):\n  - Meta: %j\n  - Res : %j', req.meta, req)))
    } else {
      subscriptions.forEach(s => s.unsubscribe())
      subscriptions.length = 0
    }
  })

  function write (request) {
    return hmac
      .open()
      .then(() => hmac.write({ funcId: request.meta.funcId, params: request.meta.data }))
      .then(() => outboundRequests.next(request))
  }

  function send (params, options, funcMeta) {
    options = Object.assign({}, options, {
      callbackId: funcMeta.decodeCallback ? callbackIdGenerator.nextId() : undefined,
      hasResponse: typeof funcMeta.decodeResponse === 'function',
      hasCallback: typeof funcMeta.decodeCallback === 'function'
    })

    const request = funcMeta.encodeRequest(params, options.callbackId)
    const requestHandler = createRequestHandler(internalApi, request, options)

    requests.push(requestHandler)
    requests.sort((a, b) => a.priority - b.priority)
    processRequests()
    return requestHandler.response
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

  const result = {
    open: hmac.open,
    close: hmac.close,
    isOpen: hmac.isOpen,
    frames,
    outboundRequests,
    inboundRequests,
    inboundResponses
  }

  functions.definitions.filter(d => d.encodeRequest).forEach(funcMeta => {
    result[funcMeta.name] = (params, options) => send(params, options, funcMeta)
  })

  return result
}

function createRequestHandler (api, request, options) {
  options = Object.assign(
    {
      priority: 0,
      timeout: 6000
    },
    options
  )

  const clientResponse = createPromise()

  function execute () {
    const writePromise = api.write(request)
    const responsePromise = options.hasResponse ? api.inboundResponses.pipe(
      filter(f => f.meta.funcId === request.meta.funcId),
      take(1),
      timeout(options.timeout)
    ).toPromise() : Promise.resolve()

    return Promise.all([writePromise, responsePromise]).then((res) => {
      const response = res[1]
      clientResponse.resolve(response)
    }, clientResponse.reject)
  }
  return {
    execute,
    options,
    request,
    response: clientResponse.promise
  }
}

function createCallbackObservable () {

}

module.exports = {
  serialApi
}
