const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'getCapabilities'
const funcId = consts.FUNC_ID_SERIAL_API_GET_CAPABILITIES

function decodeResponseData (reader, response) {
  response.applVersion = reader.readByte()
  response.applRevision = reader.readByte()
  response.manufacturerId = reader.readWord()
  response.manufacturerProductType = reader.readWord()
  response.supportedFunctions = []
  reader.readBytes(32, data => {
    for (let i = 0; i < 256; i++) {
      const funcId = i + 1
      const supported = ((data[(i >> 3)] >> (i % 8)) & 0x01) !== 0
      if (supported) {
        response.supportedFunctions.push({
          funcId
        })
      }
    }
  })
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcId),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
