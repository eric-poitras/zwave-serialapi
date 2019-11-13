const { fromEvent } = require('rxjs')
const { map, filter } = require('rxjs/operators')
const Port = require('./port')
const functions = require('./functions')
const log = require('debug')('serialapi/api')
const { createRequest } = require('./serialapi-utils')

function serialApi (params) {
  const port = Port(params)
  const requests = []
  let currentRequest
  let nextCallbackId = 1

  function getNextCallbackId () {
    const result = nextCallbackId++
    return (result % 256 === 0) ? getNextCallbackId() : result
  }

  function open () {
    return port.open().then(processRequests)
  }

  function close () {
    return port.close()
  }

  function send (params, options, funcMeta) {
    const callbackId = funcMeta.decodeCallback ? getNextCallbackId() : undefined
    const newRequest = createRequest(result, port, log, funcMeta.encodeRequest(params, callbackId), options, funcMeta)
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

module.exports = serialApi
