const consts = require('../consts')

const name = 'requestNodeInfo'
const funcId = consts.FUNC_ID_ZW_REQUEST_NODE_INFO

function encodeRequest (request) {
  const data = []
  data[0] = request.nodeId
  return { funcId, data, request }
}

function decodeResponse (dataFrame) {
  if (dataFrame.funcId === funcId && dataFrame.type === consts.RESPONSE) {
    const data = [...dataFrame.params]

    if (data.length >= 1) {
      const response = {
        success: data[0] !== 0x00
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
