const consts = require('../consts')
const enumfmt = require('../../utils/enumfmt')

const name = 'applicationCommandHandler'
const funcId = consts.FUNC_ID_APPLICATION_COMMAND_HANDLER

const frameTypeFormat = enumfmt({
  [consts.RECEIVE_STATUS_TYPE_SINGLE]: 'SINGLE',
  [consts.RECEIVE_STATUS_TYPE_BROAD]: 'BROADCAST',
  [consts.RECEIVE_STATUS_TYPE_MULTI]: 'MULTICAST',
  [consts.RECEIVE_STATUS_TYPE_EXPLORE]: 'EXPLORE'
})

function decodeCallback (dataFrame) {
  if (dataFrame.funcId === funcId && dataFrame.type === consts.REQUEST) {
    const data = [...dataFrame.params]

    if (data.length >= 1) {
      const rxStatus = data[0]
      const routeLocked = (rxStatus & consts.RECEIVE_STATUS_ROUTED_BUSY) === consts.RECEIVE_STATUS_ROUTED_BUSY
      const lowPower = (rxStatus & consts.RECEIVE_STATUS_LOW_POWER) === consts.RECEIVE_STATUS_LOW_POWER
      const frameType = frameTypeFormat.format(rxStatus & 0x1C)
      const sourceNodeId = data[1]
      const cmdLen = data[2]
      const command = data.slice(3, 3 + cmdLen)
      const callback = {
        status: {
          routeLocked,
          lowPower,
          frameType
        },
        sourceNodeId,
        command: command
      }
      return { funcId, data, callback }
    }
  }
}

module.exports = {
  name,
  funcId,
  decodeCallback
}
