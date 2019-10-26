const Port = require('./port')
const consts = require('./consts')
const functions = require('./functions')
const EventEmitter = require('events')
const log = require('debug')('serialapi/api')

const defaultRequestOptions = {
  priority: 0,
  timeout: 6000
}

function SerialApi (params) {
  const events = new EventEmitter()
  const port = Port(params)
  const requests = []
  let requestCtx
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

      const write = port.write({ funcId: request.funcId, params: request.data })
      const response = ResponseHandler(requestCtx.handleResponse, requestCtx.timeout, port)

      log('HOST->ZW (REQ): %j', request)
      Promise.all([write, response]).then((res) => {
        const response = res[1]
        log('HOST->ZW (REQ): %j (Completed)', request)
        if (request.handleResponse) {
          log('ZW->HOST (RES): %j', response)
        }
        requestCtx.resolve(response)
      }, requestCtx.reject).finally(() => {
        requestCtx = undefined
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
          log('ZW->HOST (REQ): %j', request)
          events.emit('request', request)
        }
      } else {
        log('Unsupported Frame:\nZW->HOST (REQ): %j', frame)
        events.emit('request', frame)
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

function ResponseHandler (responseHandler, timeout, port) {
  if (!responseHandler) {
    return Promise.resolve()
  } else {
    return new Promise((resolve, reject) => {
      port.on('dataframe', onResponse)
      const timeoutObj = setTimeout(onTimeout, timeout)
      function onResponse (frame) {
        if (frame.type === consts.RESPONSE) {
          const response = responseHandler(frame)
          if (response) {
            resolve(response)
            clearTimeout(timeoutObj)
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

module.exports = SerialApi
