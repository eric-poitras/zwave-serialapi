const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'isFailedNode'
const funcId = consts.FUNC_ID_ZW_IS_FAILED_NODE_ID

function encodeRequestData (request) {
  const data = []
  data.push(request.nodeId)
  return data
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildRequestEncoder(funcId, encodeRequestData),
  decodeResponse: funcUtils.buildBooleanResponseDecoder(funcId)
}
