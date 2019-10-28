const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'memoryGetId'
const funcId = consts.FUNC_ID_MEMORY_GET_ID

function decodeResponseData (reader, response) {
  response.homeId = reader.readInteger()
  response.nodeId = reader.readByte()
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcId),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
