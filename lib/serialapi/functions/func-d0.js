const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'setPromiscuousMode'
const funcId = consts.FUNC_ID_ZW_SET_PROMISCUOUS_MODE

function encodeRequestData (request) {
  const data = []
  data.push(request.enabled ? 0x01 : 0x00)
  return data
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildRequestEncoder(funcId, encodeRequestData)
}
