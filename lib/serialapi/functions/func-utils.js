const consts = require('../consts')
const formats = require('./formats')
const arrayReader = require('../../utils/array-reader')

function buildRequestEncoder (funcId, dataEncoder) {
  return (request, callbackId) => {
    let data = dataEncoder(request, callbackId)
    if (!data) {
      data = []
    }
    const result = Object.assign({}, request)
    Object.defineProperty(result, 'meta', { value: { funcId, data, callbackId } })
    return result
  }
}

function buildResponseDecoder (funcId, dataDecoder) {
  return (dataFrame) => {
    if (dataFrame.funcId === funcId && dataFrame.type === consts.RESPONSE) {
      const data = [...dataFrame.params]
      const response = {}
      dataDecoder(arrayReader(data), response)
      Object.defineProperty(response, 'meta', { value: { funcId, data } })
      return response
    }
  }
}

function buildCallbackDecoder (funcId, dataDecoder) {
  return (dataFrame) => {
    if (dataFrame.funcId === funcId && dataFrame.type === consts.REQUEST) {
      const data = [...dataFrame.params]
      const request = {}
      const callbackId = dataDecoder(arrayReader(data), request)
      return Object.defineProperty(request, 'meta', { value: { funcId, data, callbackId } })
    }
  }
}

function buildNoParameterRequestEncoder (funcId) {
  return buildRequestEncoder(funcId, () => [])
}

function buildBooleanResponseDecoder (funcId) {
  return buildResponseDecoder(funcId, (reader, response) => {
    response.success = reader.readByte(b => b !== 0)
  })
}

function decodeRxStatus (rxStatus) {
  return {
    routeLocked: (rxStatus & consts.RECEIVE_STATUS_ROUTED_BUSY) === consts.RECEIVE_STATUS_ROUTED_BUSY,
    lowPower: (rxStatus & consts.RECEIVE_STATUS_LOW_POWER) === consts.RECEIVE_STATUS_LOW_POWER,
    frameType: formats.frameTypeFormat.format(rxStatus & 0x1C),
    foreignFrame: (rxStatus & consts.RECEIVE_STATUS_FOREIGN_FRAME) === consts.RECEIVE_STATUS_FOREIGN_FRAME,
    foreignHome: (rxStatus & consts.RECEIVE_STATUS_FOREIGN_HOMEID) === consts.RECEIVE_STATUS_FOREIGN_HOMEID
  }
}

function decodeNodeInformation (nif) {
  if (nif.length === 0) return
  const reader = arrayReader(nif)
  const result = {}
  result.basicClass = reader.readByte()
  result.genericClass = reader.readByte()
  result.specificClass = reader.readByte()
  result.commandClasses = []
  for (let cc = reader.readByte(); cc !== undefined; cc = reader.readByte()) {
    result.commandClasses.push(cc)
  }
  return result
}

module.exports = {
  buildRequestEncoder,
  buildResponseDecoder,
  buildCallbackDecoder,
  buildNoParameterRequestEncoder,
  buildBooleanResponseDecoder,

  decodeRxStatus,
  decodeNodeInformation
}
