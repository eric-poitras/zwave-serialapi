const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'setDefault'
const funcId = consts.FUNC_ID_ZW_SET_DEFAULT

function encodeRequestData (request, params) {
  const data = []
  data[0] = params.callbackId
  return data
}

function decodeCallbackData (reader, result) {
  const callbackId = reader.readByte()
  return { callbackId }
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildRequestEncoder(funcId, encodeRequestData),
  decodeCallback: funcUtils.buildCallbackDecoder(funcId, decodeCallbackData)
}
