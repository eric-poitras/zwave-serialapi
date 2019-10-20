const consts = require('../consts')

const name = 'isFailedNode'
const funcId = consts.FUNC_ID_ZW_IS_FAILED_NODE_ID

function encodeRequest (request) {
  const data = []
  data.push(request.nodeId)
  return { funcId, data, request }
}

function decodeResponse (dataFrame) {
  if (dataFrame.funcId === funcId && dataFrame.type === consts.RESPONSE) {
    const data = [...dataFrame.params]
    if (data.length >= 1) {
      const response = {
        failed: data[0] !== 0x00
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
