const consts = require('../consts')
const funcUtils = require('./func-utils')
const { controllerUpdateStateFormat } = require('./formats')

const name = 'applicationControllerUpdate'
const funcId = consts.FUNC_ID_ZW_APPLICATION_CONTROLLER_UPDATE

function decodeCallbackData (reader, result) {
  const status = reader.readByte()
  result.updateStatus = controllerUpdateStateFormat.format(status)
  if ({
    [consts.UPDATE_STATE_SUC_ID]: true,
    [consts.UPDATE_STATE_NODE_INFO_RECEIVED]: true,
    [consts.UPDATE_STATE_DELETE_DONE]: true,
    [consts.UPDATE_STATE_NEW_ID_ASSIGNED]: true
  }[status]) {
    result.nodeId = reader.readByte()
    result.nodeInfo = reader.readVarBytes(funcUtils.decodeNodeInformation)
  }
}

module.exports = {
  name,
  funcId,
  decodeCallback: funcUtils.buildCallbackDecoder(funcId, decodeCallbackData)
}
