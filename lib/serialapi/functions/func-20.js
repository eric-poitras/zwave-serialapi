const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'memoryGetId'
const funcId = consts.FUNC_ID_MEMORY_GET_ID

function decodeResponseData (data) {
  if (data.length >= 5) {
    const response = {
      homeId: ((data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3]) & 0xffffffff,
      nodeId: data[4]
    }
    return response
  }
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcId),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
