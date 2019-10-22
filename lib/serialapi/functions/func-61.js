const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'removeFailedNode'
const funcId = consts.FUNC_ID_ZW_REMOVE_FAILED_NODE_ID

function encodeRequest (request, callbackId) {
  const data = []
  data.push(request.nodeId)
  data.push(callbackId)
  return data
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildRequestEncoder(funcId, encodeRequest),
  decodeResponse: funcUtils.buildBooleanResponseDecoder(funcId)
}
