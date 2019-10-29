const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'setSUCNodeId'
const funcId = consts.FUNC_ID_ZW_SET_SUC_NODE_ID

function encodeRequestData (request) {
  const data = []
  data.push(request.nodeId)
  data.push(request.SUCState ? 0x01 : 0x00)
  data.push(request.lowPower ? 0x01 : 0x00)
  data.push(request.enableSIS ? consts.ZW_SUC_FUNC_NODEID_SERVER : 0x00)
  return data
}

function decodeResponseData (reader, response) {
  response.SUCNodeId = reader.readByte(b => b !== 0 ? b : undefined)
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildRequestEncoder(funcId, encodeRequestData),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
