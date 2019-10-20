const Port = require('./port')
const consts = require('./consts')
const functions = require('./functions')
const EventEmitter = require('events')
const log = require('debug')('serialapi:api')

function SerialApi (params) {
  const events = new EventEmitter()
  const port = Port(params)
  const txQueue = []
  let currentSession
  let nextCallbackId = 1

  function open () {
    return port.open().then(processTxs)
  }

  function send (request, txOptions) {
    return new Promise(function (resolve, reject) {
      const tx = Object.assign({
        priority: 0,
        timeout: 6000
      }, txOptions, {
        resolve,
        reject,
        request
      })
      txQueue.push(tx)
      txQueue.sort((a, b) => a.priority - b.priority)
      processTxs()
    })
  }

  function processTxs () {
    if (port.isOpen() && !currentSession && txQueue.length > 0) {
      const tx = txQueue.shift()
      currentSession = performTransaction(port, tx)
        .then(tx.resolve, tx.reject)
        .finally(() => {
          currentSession = null
          processTxs()
        })
    }
  }

  function performTransaction (port, tx) {
    return new Promise((resolve, reject) => {
      const callbackId = tx.handleCallback ? nextCallbackId++ : undefined

      let request
      if (typeof tx.encodeRequest === 'function') {
        request = tx.encodeRequest(tx.request, callbackId)
      } else {
        request = tx.request
      }

      port.write({
        funcId: request.funcId,
        params: request.data
      }).then(() => {
        if (tx.handleResponse) {
          waitForResponse(port, tx, request, callbackId).then(resolve, reject)
        } else {
          log('Request completed.\nHOST->ZW (REQ): %j', request)
          resolve(undefined)
        }
      }).catch((err) => {
        reject(err)
      })
    })
  }

  function waitForResponse (port, tx, request, callbackId) {
    let cleanupTransaction
    return new Promise((resolve, reject) => {
      port.on('dataframe', responseListener)
      cleanupTransaction = function () {
        port.off('dataframe', responseListener)
      }

      const responseTimeout = setTimeout(function () {
        log('Timed-out after %d ms waiting for response.\nREQ: %j', tx.responseWaitMs, request)
        reject(new Error('timeout'))
      }, tx.responseWaitMs)

      function responseListener (frame) {
        if (responseTimeout) {
          const response = tx.handleResponse(frame, callbackId)
          if (response) {
            log('Request/response completed.\nHOST->ZW (REQ): %j \nZW->HOST (RES): %j', request, response)
            clearTimeout(responseTimeout)
            resolve(response.response)
          }
        }
      }
    }).finally(cleanupTransaction)
  }

  const result = {
    open,
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
      result[name] = function (request) {
        request = Object.assign({}, request)
        return send(request, {
          name,
          funcId,
          encodeRequest,
          handleResponse: decodeResponse,
          handleCallback: decodeCallback
        })
      }
    }

    funcMetaByFuncId[funcId] = funcMeta
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
        log('UnsupportedFrame:\nZW->HOST (REQ): %j', frame)
        events.emit('request', frame)
      }
    }
  })

  return result
}

module.exports = SerialApi
