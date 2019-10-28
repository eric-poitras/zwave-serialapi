const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'sendDataAbort'
const funcId = consts.FUNC_ID_ZW_SEND_DATA_ABORT

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcId)
}
