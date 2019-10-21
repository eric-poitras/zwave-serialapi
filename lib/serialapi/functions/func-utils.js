const consts = require('../consts')

function buildRequestEncoder (funcId, dataEncoder) {
  return (request, callbackId) => {
    let data = dataEncoder(request, callbackId)
    if (!data) {
      data = []
    }
    return { funcId, data, request }
  }
}

function buildResponseDecoder (funcId, dataDecoder) {
  return (dataFrame) => {
    if (dataFrame.funcId === funcId && dataFrame.type === consts.RESPONSE) {
      const data = [...dataFrame.params]
      const response = dataDecoder(data)
      return { funcId, data, response }
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
  encodeNoParameterRequest,
  decodeBooleanResponse
}
