const Port = require('./port')
const consts = require('./consts')
const functions = require('./functions')
const EventEmitter = require('events')
const log = require('debug')('serialapi/api')
const createRequest = require('./serialapi-request')

function SerialApi (params) {
  const events = new EventEmitter()
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

  port.on('dataframe', function (frame) {
    if (frame.type === consts.REQUEST) {
      const funcMeta = funcMetaByFuncId[frame.funcId]
      if (funcMeta && typeof funcMeta.decodeCallback === 'function') {
        const request = funcMeta.decodeCallback(frame)
        if (request) {
          log('ZW->HOST (REQ): %s\n%j', funcMeta.name, request)
          events.emit(funcMeta.name, request)
        }
      }
    }
    events.emit('frame', frame)
  })

  const result = {
    open,
    close,
    send,
    isOpen: port.isOpen.bind(port),
    on: events.on.bind(events),
    once: events.once.bind(events),
    off: events.off.bind(events)
  }

  const funcMetaByFuncId = {}
  for (const funcMeta of functions) {
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

    funcMetaByFuncId[funcId] = funcMeta
  }

  return result
}

module.exports = SerialApi
