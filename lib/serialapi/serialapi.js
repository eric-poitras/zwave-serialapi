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

  function send (request) {
    const newRequest = createRequest({
      port,
      log,
      callbackIdProvider: getNextCallbackId,
      request
    })
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
    map(functions.processCallback),
    filter(x => x !== undefined)
  )
  const inboundResponses = frames.pipe(
    map(functions.processResponse),
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

  for (const funcMeta of functions.definitions) {
    const { name, funcId, encodeRequest, decodeResponse, decodeCallback } = funcMeta
    if (encodeRequest) {
      result[name] = function (params) {
        return send({
          name,
          funcId,
          params,
          encodeRequest,
          handleResponse: decodeResponse,
          handleCallback: decodeCallback
        })
      }
    }
  }

  return result
}

module.exports = serialApi
