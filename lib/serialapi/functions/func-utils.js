const consts = require('../consts')

function buildRequestEncoder (funcId, dataEncoder) {
  return (request, callbackId) => {
    let data = dataEncoder(request, callbackId)
    if (!data) {
      data = []
    }
    return Object.assign({}, request, { funcId, data, callbackId })
  }
}

function buildResponseDecoder (funcId, dataDecoder) {
  return (dataFrame, callbackId) => {
    if (dataFrame.funcId === funcId && dataFrame.type === consts.RESPONSE) {
      const data = [...dataFrame.params]
      const response = dataDecoder(data)
      return Object.assign({}, response, { funcId, data, callbackId })
    }
  }
}

function buildCallbackDecoder (funcId, dataDecoder) {
  return (dataFrame) => {
    if (dataFrame.funcId === funcId && dataFrame.type === consts.REQUEST) {
      const data = [...dataFrame.params]
      const callback = dataDecoder(data)
      return Object.assign({ funcId, data, callbackId: undefined }, callback)
    }
  }
}

function encodeNoParameterRequest (funcId) {
  return buildRequestEncoder(funcId, () => [])
}

function decodeBooleanResponse (funcId) {
  return buildResponseDecoder(funcId, (data) => {
    if (data.length >= 1) {
      const response = {
        success: data[0] !== 0x00
      }
      return response
    }
  })
}

module.exports = {
  buildRequestEncoder,
  buildResponseDecoder,
  buildCallbackDecoder,
  buildNoParameterRequestEncoder: encodeNoParameterRequest,
  buildBooleanResponseDecoder: decodeBooleanResponse
}
