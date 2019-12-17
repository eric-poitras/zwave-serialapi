const { fromEvent, Subject, ReplaySubject } = require('rxjs')
const { map, filter, take, timeout, distinctUntilChanged } = require('rxjs/operators')
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
  const logReq = header => req => log('%s:\n  - Meta: %j\n  - Req : %j', header, req.meta, req)
  subscriptions.push(frames.pipe(
    map(frame => processCallback(functions.definitionsById[frame.funcId], frame)),
    filter(x => x !== undefined)
  ).subscribe(inboundRequests))
  subscriptions.push(frames.pipe(
    map(frame => processResponse(functions.definitionsById[frame.funcId], frame)),
    filter(x => x !== undefined)
  ).subscribe(inboundResponses))
  subscriptions.push(outboundRequests.subscribe(logReq('HOST->ZW (REQ)')))
  subscriptions.push(inboundRequests.subscribe(logReq('ZW->HOST (REQ)')))
  subscriptions.push(inboundResponses.subscribe(logReq('ZW->HOST (RES)')))
  subscriptions.push(hmac.isOpen.pipe(distinctUntilChanged()).subscribe(value => log(`hmac open state changed to ${value}`)))
  function dispose () {
    return hmac.close().then(() => subscriptions.forEach(s => s.unsubscribe()))
  }

  function write (request) {
    return hmac
      .open()
      .then(() => hmac.write({ funcId: request.meta.funcId, params: request.meta.data }))
      .then(() => outboundRequests.next(request))
  }

  function send (params, options, funcDef) {
    const hasResponse = typeof funcDef.decodeResponse === 'function'
    const hasCallback = typeof funcDef.decodeCallback === 'function'
    const callbackId = hasCallback ? callbackIdGenerator.nextId() : undefined

    const request = funcDef.encodeRequest(params, { callbackId, hasResponse })
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
    hmacOpen: hmac.open,
    hmacIsOpen: hmac.isOpen,
    hmacClose: hmac.close,
    dispose,
    frames,
    outboundRequests,
    inboundRequests,
    inboundResponses
  }

  functions.definitions
    .filter(d => d.encodeRequest)
    .forEach(funcMeta => {
      result[funcMeta.name] = (params, options) => send(params, options, funcMeta)
    })

  functions.definitions
    .filter(d => !d.encodeRequest && d.decodeCallback)
    .forEach(funcMeta => {
      const subjectCb = new Subject()
      inboundRequests.pipe(filter(cb => cb.meta.funcId === funcMeta.funcId)).subscribe(subjectCb)
      result[funcMeta.name] = subjectCb
    })

  return result
}

function createRequestHandler (api, request, options) {
  options = Object.assign(
    {
      priority: 0,
      responseTimeout: 6000,
      callbackTimeout: 6500
    },
    options
  )

  const clientResponse = createPromise()

  function execute () {
    let result = api.write(request).then(_ => ({}))

    if (request.meta.hasResponse) {
      result = Promise.all([result,
        api.inboundResponses.pipe(
          filter(f => f.meta.funcId === request.meta.funcId),
          take(1),
          timeout(options.responseTimeout)
        ).toPromise()
      ]).then(res => res[1])
    }

    if (request.meta.callbackId) {
      const callbacks = new ReplaySubject()
      const completeCallbacks = () => {
        callbacks.complete()
        callbackSub.unsubscribe()
        callbackSub = undefined
      }
      const completeCallbacksIfNoMore = (meta) => {
        if (!meta.hasCallback) completeCallbacks()
      }

      let callbackSub = api.inboundRequests.pipe(
        filter(f => f.meta.funcId === request.meta.funcId && f.meta.callbackId === request.meta.callbackId),
        take(1),
        timeout(options.callbackTimeout)
      ).subscribe(cb => {
        callbacks.next(cb)
        completeCallbacksIfNoMore(cb.meta)
      }, err => {
        log('Callback for request %j returned an error:', request, err)
        callbacks.error(err)
        completeCallbacks()
      })

      result = result.then(res => {
        Object.defineProperty(res, 'callbacks', { value: callbacks })
        completeCallbacksIfNoMore(res.meta)
        return res
      }, err => {
        completeCallbacks()
        throw err
      })
    }

    return result.then(clientResponse.resolve, clientResponse.reject)
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
