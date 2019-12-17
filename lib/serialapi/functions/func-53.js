const consts = require('../consts')
const funcUtils = require('./func-utils')
const { sucUpdateFormat } = require('./formats')

const name = 'requestNetworkUpdate'
const funcId = consts.FUNC_ID_ZW_REQUEST_NETWORK_UPDATE

function buildCallbackDecoderData (reader, response) {
  const callbackId = reader.readByte()
  response.status = reader.readByte(b => sucUpdateFormat.format(b))
  return { callbackId }
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildCallbackIdOnlyRequestEncoder(funcId),
  decodeResponse: funcUtils.buildBooleanResponseDecoder(funcId),
  decodeCallback: funcUtils.buildCallbackDecoder(funcId, buildCallbackDecoderData)
}
