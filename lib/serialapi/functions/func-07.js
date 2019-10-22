const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'getCapabilities'
const funcId = consts.FUNC_ID_SERIAL_API_GET_CAPABILITIES

function decodeResponseData (data) {
  if (data.length >= 40) {
    const result = {}
    result.applVersion = data[0]
    result.applRevision = data[1]
    result.manufacturerId = (data[2] << 8) + data[3]
    result.manufacturerProductType = (data[4] << 8) + data[5]
    result.supportedFunctions = []
    for (let i = 0; i < 256; i++) {
      const funcId = i + 1
      const supported = ((data[6 + (i >> 3)] >> (i % 8)) & 0x01) !== 0
      if (supported) {
        result.supportedFunctions.push({
          funcId
        })
      }
    }
    return result
  }
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcUtils),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
