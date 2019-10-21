const consts = require('../consts')
const enumfmt = require('../../utils/enumfmt')

const name = 'applicationControllerUpdate'
const funcId = consts.FUNC_ID_ZW_APPLICATION_CONTROLLER_UPDATE

const updateStatusFmt = enumfmt({
  [consts.UPDATE_STATE_SUC_ID]: 'SUC_ID',
  [consts.UPDATE_STATE_NODE_INFO_RECEIVED]: 'NODE_INFO_RECEIVED',
  [consts.UPDATE_STATE_DELETE_DONE]: 'DELETE_NODE',
  [consts.UPDATE_STATE_NEW_ID_ASSIGNED]: 'NEW_ID_ASSIGNED'
})

function decodeCallback (dataFrame) {
  if (dataFrame.funcId === funcId && dataFrame.type === consts.REQUEST) {
    const data = [...dataFrame.params]
    const callback = {}

    if (data.length >= 1) {
      const status = data[0]
      callback.updateStatus = updateStatusFmt.format(status)
      if ({
        [consts.UPDATE_STATE_SUC_ID]: true,
        [consts.UPDATE_STATE_NODE_INFO_RECEIVED]: true,
        [consts.UPDATE_STATE_DELETE_DONE]: true,
        [consts.UPDATE_STATE_NEW_ID_ASSIGNED]: true
      }[status]) {
        if (data.length >= 3) {
          callback.nodeId = data[1]
          const len = data[2]
          if (len >= 3) {
            callback.deviceClasses = {
              basic: data[3],
              generic: data[4],
              specific: data[5]
            }
            callback.commandClasses = []
            for (let i = 0; i < len - 3; i++) {
              callback.commandClasses.push(data[6 + i])
            }
          }
        }
        return { funcId, data, callback }
      }
    }
  }
}

module.exports = {
  name,
  funcId,
  decodeCallback
}
