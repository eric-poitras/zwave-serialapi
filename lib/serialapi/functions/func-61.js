const consts = require('../consts')

const name = 'removeFailedNode'
const funcId = consts.FUNC_ID_ZW_REMOVE_FAILED_NODE_ID

function encodeRequest (request, callbackId) {
  const data = []
  data.push(request.nodeId)
  data.push(callbackId)
  return { funcId, data, request }
}

function decodeResponse (dataFrame) {
  if (dataFrame.funcId === funcId && dataFrame.type === consts.RESPONSE) {
    const data = [...dataFrame.params]

    if (data.length >= 1) {
      const response = {
        success: data[0] === 0x00
      }
      return { funcId, data, response }
    }
  }
}

module.exports = {
  name,
  funcId,
  encodeRequest,
  decodeResponse,
  decodeCallback: true
}
