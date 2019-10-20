const consts = require('../consts')

const name = 'getInitData'
const funcId = consts.FUNC_ID_SERIAL_API_GET_INIT_DATA

function encodeRequest (request) {
  return { funcId, data: [], request }
}

function decodeResponse (dataFrame) {
  if (dataFrame.funcId === funcId && dataFrame.type === consts.RESPONSE) {
    const data = [...dataFrame.params]
    if (data.length >= 3) {
      const nodesLen = data[2]
      if (data.length >= (5 + nodesLen)) {
        const response = {}
        response.apiVersion = data[0]
        response.apiType = (data[1] & 0x01) ? 'slaveApi' : 'controllerApi'
        response.timerSupported = ((data[1] >> 1) & 0x01) !== 0
        response.controllerType = ((data[1] >> 2) & 0x01) ? 'secondary' : 'primary'
        response.sis = ((data[1] >> 3) & 0x01) !== 0
        if (nodesLen === 29) {
          response.nodes = []
          for (let i = 0; i < 232; i++) {
            const present = ((data[3 + (i >> 3)] >> (i % 8)) & 0x01) !== 0
            if (present) {
              response.nodes.push({
                nodeId: i + 1
              })
            }
          }
        }
        response.chipType = data[3 + nodesLen]
        response.chipVersion = data[4 + nodesLen]
        return { funcId, data, response }
      }
    }
  }
}

module.exports = {
  name,
  funcId,
  encodeRequest,
  decodeResponse
}
