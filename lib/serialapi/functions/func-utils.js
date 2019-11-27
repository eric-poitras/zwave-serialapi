const consts = require('../consts')
const formats = require('./formats')
const arrayReader = require('../../utils/array-reader')

function buildRequestEncoder (funcId, dataEncoder) {
  return (request, metaIn) => {
    const data = dataEncoder(request, metaIn) || []
    const result = Object.assign({}, request)
    Object.defineProperty(result, 'meta', { value: Object.assign({}, metaIn, { funcId, data }) })
    return result
  }
}

function buildResponseDecoder (funcId, dataDecoder) {
  return (dataFrame, metaIn) => {
    if (dataFrame.funcId === funcId && dataFrame.type === consts.RESPONSE) {
      const data = [...dataFrame.params]
      const response = {}
      const metaOut = dataDecoder(arrayReader(data), response, metaIn) || {}
      Object.defineProperty(response, 'meta', { value: Object.assign(metaOut, metaIn, { funcId, data }) })
      return response
    }
  }
}

function buildCallbackDecoder (funcId, dataDecoder) {
  return (dataFrame, metaIn) => {
    if (dataFrame.funcId === funcId && dataFrame.type === consts.REQUEST) {
      const data = [...dataFrame.params]
      const request = {}
      const metaOut = dataDecoder(arrayReader(data), request, metaIn) || {}
      return Object.defineProperty(request, 'meta', { value: Object.assign(metaOut, metaIn, { funcId, data }) })
    }
  }
}

function buildNoParameterRequestEncoder (funcId) {
  return buildRequestEncoder(funcId, () => [])
}

function buildBooleanResponseDecoder (funcId) {
  return buildResponseDecoder(funcId, (reader, response) => {
    response.success = reader.readByte(b => b !== 0)
    return { hasCallback: response.success }
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
