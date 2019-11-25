const proxyquire = require('proxyquire').noPreserveCache().noCallThru()
const sinon = require('sinon')
const { buildRequestEncoder, buildResponseDecoder, buildCallbackDecoder } = require('../../lib/serialapi/functions/func-utils')

function buildTestFunction (name, funcId, opts) {
  opts = Object.assign({
    isRequest: true,
    requestData: [],
    hasResponse: false,
    response: { response: name },
    hasCallback: false,
    callback: { callback: name }
  }, opts)
  const result = {
    name,
    funcId
  }
  if (opts.isRequest) {
    result.encodeRequest = sinon.spy(buildRequestEncoder(funcId, () => opts.requestData))
  }
  if (opts.hasResponse) {
    result.decodeResponse = sinon.spy(buildResponseDecoder(funcId, (data, response) => {
      Object.assign(response, opts.response)
    }))
  }
  if (opts.hasCallback) {
    result.decodeCallback = sinon.spy(buildCallbackDecoder(funcId, (data, response) => {
      Object.assign(response, opts.callback)
      return data.readByte()
    }))
  }
  return result
}

function setupMockedSerialApi () {
  const createMockPort = require('./mock-port')
  const port = createMockPort('/dev/ttyMock1')
  const hmac = proxyquire('../../lib/serialapi/port', {
    serialport: port.api.constructor,
    '@global': true
  })

  const definitions = [
    buildTestFunction('unicast1', 1),
    buildTestFunction('unicast2', 2),
    buildTestFunction('unicast3', 3),
    buildTestFunction('bidi11', 11, { hasResponse: true }),
    buildTestFunction('bidi12', 12, { hasResponse: true }),
    buildTestFunction('unicastWithCallback21', 21, { hasCallback: true }),
    buildTestFunction('bidiWithCallback22', 22, { hasResponse: true, hasCallback: true }),
    buildTestFunction('callbackOnly41', 41, { isRequest: false, hasCallback: true })
  ]
  const definitionsByName = {}
  definitions.forEach(d => { definitionsByName[d.name] = d })

  const serialApi = proxyquire('../../lib/serialapi/serialapi', {
    './port': hmac,
    './functions': definitions
  }).serialApi({
    port: port.name
  })

  return {
    port,
    hmac,
    serialApi,
    definitions: definitionsByName
  }
}

module.exports = setupMockedSerialApi
