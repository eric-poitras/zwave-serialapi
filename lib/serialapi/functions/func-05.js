const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'getControllerCapabilities'
const funcId = consts.FUNC_ID_ZW_GET_CONTROLLER_CAPABILITIES

function decodeResponseData (data) {
  if (data.length >= 1) {
    const result = {}
    const retval = data[0]
    result.isSecondary = (retval & consts.CONTROLLER_IS_SECONDARY) !== 0
    result.isSuc = (retval & consts.CONTROLLER_IS_SUC) !== 0
    result.isOnOtherNetwork = (retval & consts.CONTROLLER_ON_OTHER_NETWORK) !== 0
    result.nodeIdServerPresent = (retval & consts.CONTROLLER_NODEID_SERVER_PRESENT) !== 0
    result.isRealPrimary = (retval & consts.CONTROLLER_IS_REAL_PRIMARY) !== 0
    return result
  }
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcId),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
