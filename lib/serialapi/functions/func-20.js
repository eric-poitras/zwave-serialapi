const consts = require('../consts')

const name = 'memoryGetId'
const funcId = consts.FUNC_ID_MEMORY_GET_ID

function encodeRequest (request) {
  return { funcId, data: [], request }
}

function decodeResponse (dataFrame) {
  if (dataFrame.funcId === funcId && dataFrame.type === consts.RESPONSE) {
    const data = [...dataFrame.params]
    if (data.length >= 5) {
      const response = {
        homeId: ((data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3]) & 0xffffffff,
        nodeId: data[4]
      }
      return { funcId, data, response }
    }
  }
}

module.exports = {
  name,
  funcId,
  encodeRequest,
  decodeResponse
}
