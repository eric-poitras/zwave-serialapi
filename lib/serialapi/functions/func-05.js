const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'getControllerCapabilities'
const funcId = consts.FUNC_ID_ZW_GET_CONTROLLER_CAPABILITIES

function decodeResponseData (reader, response) {
  Object.assign(response, reader.readByte(retval => {
    return {
      isSecondary: (retval & consts.CONTROLLER_IS_SECONDARY) !== 0,
      isSuc: (retval & consts.CONTROLLER_IS_SUC) !== 0,
      isOnOtherNetwork: (retval & consts.CONTROLLER_ON_OTHER_NETWORK) !== 0,
      nodeIdServerPresent: (retval & consts.CONTROLLER_NODEID_SERVER_PRESENT) !== 0,
      isRealPrimary: (retval & consts.CONTROLLER_IS_REAL_PRIMARY) !== 0
    }
  }))
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcId),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
