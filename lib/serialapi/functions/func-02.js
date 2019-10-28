const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'getInitData'
const funcId = consts.FUNC_ID_SERIAL_API_GET_INIT_DATA

function decodeResponseData (reader, response) {
  response.apiVersion = reader.readByte()

  Object.assign(response, reader.readByte(b => {
    return {
      apiType: (b & 0x01) ? 'SLAVE' : 'CONTROLLER',
      timerSupported: (b & 0x02) !== 0,
      controllerType: (b & 0x04) ? 'SECONDARY' : 'PRIMARY',
      sis: (b & 0x08) !== 0
    }
  }))

  response.nodes = []
  reader.readVarBytes(nodeMask => {
    for (let i = 0; i < nodeMask.length + 1; i++) {
      const present = ((nodeMask[(i >> 3)] >> (i % 8)) & 0x01) !== 0
      if (present) {
        response.nodes.push({
          nodeId: i + 1
        })
      }
    }
  })

  response.chipType = reader.readByte()
  response.chipVersion = reader.readByte()
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcId),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
