const Port = require('./port')
const consts = require('./consts')
const functions = require('./functions')
const EventEmitter = require('events')
const log = require('debug')('serialapi:api')

const defaultRequestOptions = {
  priority: 0,
  timeout: 6000
}

function SerialApi (params) {
  const events = new EventEmitter()
  const port = Port(params)
  const requests = []
  let requestCtx
  let responseTimeout
  let nextCallbackId = 1

  function getNextCallbackId (bool) {
    if (bool) {
      const result = nextCallbackId++
      return (result % 256 === 0) ? getNextCallbackId(bool) : result
    }
  }

  function open () {
    return port.open().then(processRequests)
  }

  function close () {
    return port.close()
  }

  function send (request) {
    return new Promise(function (resolve, reject) {
      requests.push(Object.assign(
        {},
        defaultRequestOptions,
        request,
        { resolve, reject }
      ))
      requests.sort((a, b) => a.priority - b.priority)
      processRequests()
    })
  }

  function processRequests () {
    if (port.isOpen() && !requestCtx && requests.length > 0) {
      requestCtx = requests.shift()
      requestCtx.request = requestCtx.encodeRequest(requestCtx.params, getNextCallbackId(requestCtx.handleCallback))
      const { request } = requestCtx

      port.write({ funcId: request.funcId, params: request.data }).then(() => {
        if (requestCtx) {
          if (!requestCtx.handleResponse) {
            log('Request completed.\nHOST->ZW (REQ): %j', request)
            requestCtx.resolve(undefined)
            cleanupCurrentRequest()
          } else {
            responseTimeout = setTimeout(() => {
              log('Timed-out after %d ms waiting for response.\nREQ: %j', requestCtx.timeout, requestCtx.encodedRequest)
              requestCtx.reject(new Error('timeout'))
              cleanupCurrentRequest()
            }, requestCtx.timeout)
          }
        }
      }, requestCtx.reject)
    }
  }

  function cleanupCurrentRequest () {
    requestCtx = undefined
    responseTimeout = undefined
    processRequests()
  }

  port.on('dataframe', function (frame) {
    if (frame.type === consts.REQUEST) {
      const funcMeta = funcMetaByFuncId[frame.funcId]
      if (funcMeta && typeof funcMeta.decodeCallback === 'function') {
        const request = funcMeta.decodeCallback(frame)
        if (request) {
          log('ZW->HOST (REQ): %j', request)
          events.emit('request', request)
        }
      } else {
        log('Unsupported Frame:\nZW->HOST (REQ): %j', frame)
        events.emit('request', frame)
      }
    } else if (frame.type === consts.RESPONSE && requestCtx) {
      const { request } = requestCtx
      const response = requestCtx.handleResponse(frame, request.callbackId)
      if (response) {
        log('Request/response completed.\nHOST->ZW (REQ): %j \nZW->HOST (RES): %j', request, response)
        clearTimeout(responseTimeout)
        requestCtx.resolve(response)
        cleanupCurrentRequest()
      }
    }
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
