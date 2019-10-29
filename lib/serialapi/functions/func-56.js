const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'getSUCNodeId'
const funcId = consts.FUNC_ID_ZW_GET_SUC_NODE_ID

function decodeResponseData (reader, response) {
  response.SUCNodeId = reader.readByte(b => b !== 0 ? b : undefined)
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcId),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
