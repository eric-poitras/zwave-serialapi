const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'setDefault'
const funcId = consts.FUNC_ID_ZW_SET_DEFAULT

function encodeRequestData (request, callbackId) {
  const data = []
  data[0] = callbackId
  return data
}

function decodeCallbackData (data) {
  if (data.length >= 1) {
    return {
      callbackId: data[0]
    }
  }
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildRequestEncoder(funcId, encodeRequestData),
  decodeCallback: funcUtils.buildCallbackDecoder(funcId, decodeCallbackData)
}
