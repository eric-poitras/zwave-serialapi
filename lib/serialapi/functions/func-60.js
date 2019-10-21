const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'requestNodeInfo'
const funcId = consts.FUNC_ID_ZW_REQUEST_NODE_INFO

function encodeRequest (request) {
  const data = []
  data[0] = request.nodeId
  return data
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildRequestEncoder(funcId, encodeRequest),
  decodeResponse: funcUtils.decodeBooleanResponse(funcId)
}
